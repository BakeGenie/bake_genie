import React from "react";
import EnquiryFormSettings from "@/components/enquiry/enquiry-form-settings";

const EnquiryFormPage = () => {
  // In a real app, you would get the userId from authentication or global state
  const userId = 1; // Default user ID for demo purposes
  
  return (
    <div className="p-6">
      <EnquiryFormSettings userId={userId} />
    </div>
  );
};

export default EnquiryFormPage;