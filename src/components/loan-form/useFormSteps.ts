import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLoanApplication } from "@/contexts/LoanApplicationContext";
import { useFormValidation } from "./useFormValidation";
import { useLoanSubmission } from "./useLoanSubmission";
import { useTermsAcceptance } from "./useTermsAcceptance";
import { toast } from "sonner";

export const useFormSteps = () => {
  const { formData, setFormData, currentStep, setCurrentStep } = useLoanApplication();
  const [searchParams] = useSearchParams();
  const [areDocumentsValid, setAreDocumentsValid] = useState(false);
  const draftId = searchParams.get('draft');

  const { validationErrors, validateStep, validateForm } = useFormValidation();
  const { isSubmitting, setIsSubmitting, handleSubmit: submitApplication } = useLoanSubmission(formData);
  const { termsAgreed, setTermsAgreed, recordTermsAcceptance } = useTermsAcceptance(draftId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep, formData)) {
      return;
    }

    // If we're not on the final terms step, just move to next step
    if (currentStep < 7) {
      // If moving to terms step, check documents first
      if (currentStep === 6 && !areDocumentsValid) {
        toast.error("Please upload all required documents before proceeding");
        return;
      }
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final submission checks
    if (!areDocumentsValid) {
      toast.error("Please upload all required documents before submitting");
      return;
    }

    if (!termsAgreed) {
      toast.error("Please agree to the terms and conditions before submitting");
      return;
    }

    // Validate all steps before final submission
    if (!validateForm(formData)) {
      return;
    }

    // Record terms acceptance
    const termsRecorded = await recordTermsAcceptance();
    if (!termsRecorded) {
      return;
    }

    // Submit the application
    const applicationId = await submitApplication();
    if (applicationId) {
      // Application submitted successfully
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    formData,
    setFormData,
    areDocumentsValid,
    setAreDocumentsValid,
    termsAgreed,
    setTermsAgreed,
    validationErrors,
    draftId,
    isSubmitting,
    handleSubmit,
  };
};