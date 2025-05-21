import React from "react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  backLink?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backLink,
  backLabel,
  actions,
}) => {
  return (
    <div className="sticky top-0 z-10 flex items-center h-14 px-4 bg-white border-b border-gray-200">
      {backLink && (
        <Link href={backLink} className="flex items-center text-gray-500 hover:text-gray-700 mr-4">
          <ChevronLeft className="h-5 w-5" />
          {backLabel && <span className="ml-1 text-sm">{backLabel}</span>}
        </Link>
      )}
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
};

export default PageHeader;
