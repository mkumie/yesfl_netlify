import { supabase } from "@/integrations/supabase/client";
import { LoanApplicationData } from "@/contexts/LoanApplicationContext";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoanStatus } from "@/types/loan";

export const useLoanSubmission = (formData: LoanApplicationData) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be logged in to submit an application");
      return null;
    }

    try {
      console.log("Starting application submission process");
      console.log("Draft ID:", draftId);
      
      const applicationData = {
        user_id: user.id,
        status: 'pending' as LoanStatus,
        first_name: formData.firstName,
        surname: formData.surname,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        marital_status: formData.maritalStatus,
        district: formData.district,
        village: formData.village,
        home_province: formData.homeProvince,
        employment_status: formData.employmentStatus,
        employer_name: formData.employerName,
        occupation: formData.occupation,
        monthly_income: parseFloat(formData.monthlyIncome || '0'),
        employment_length: formData.employmentLength,
        work_address: formData.workAddress,
        work_phone: formData.workPhone,
        loan_amount: parseFloat(formData.loanAmount || '0'),
        loan_purpose: formData.loanPurpose,
        repayment_period: parseInt(formData.repaymentPeriod || '0'),
        existing_loans: formData.existingLoans,
        existing_loan_details: formData.existingLoanDetails,
        reference_full_name: formData.referenceFullName,
        reference_relationship: formData.referenceRelationship,
        reference_address: formData.referenceAddress,
        reference_phone: formData.referencePhone,
        reference_occupation: formData.referenceOccupation,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        account_type: formData.accountType,
        branch_name: formData.branchName,
        account_holder_name: formData.accountHolderName,
      };

      let result;
      
      if (draftId) {
        // Update existing draft application
        console.log("Updating existing draft application:", draftId);
        const { data, error } = await supabase
          .from("loan_applications")
          .update(applicationData)
          .eq('id', draftId)
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new application
        console.log("Creating new application");
        const { data, error } = await supabase
          .from("loan_applications")
          .insert(applicationData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Get the latest terms version
      const { data: latestTerms, error: termsError } = await supabase
        .from("terms_versions")
        .select("id")
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();

      if (termsError) throw termsError;

      // Record terms acceptance
      const { error: acceptanceError } = await supabase
        .from("terms_acceptances")
        .insert({
          user_id: user.id,
          loan_application_id: result.id,
          terms_version_id: latestTerms.id,
        });

      if (acceptanceError) throw acceptanceError;

      console.log("Application submitted successfully:", result.id);
      toast.success("Application submitted successfully!");
      navigate("/dashboard");
      return result.id;
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
      return null;
    }
  };

  return {
    handleSubmit
  };
};