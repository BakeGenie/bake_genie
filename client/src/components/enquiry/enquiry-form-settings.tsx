import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ClipboardIcon, ArrowLeftIcon, PlusCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CustomField = {
  id: string;
  name: string;
  type: "dropdown";
  options: string[];
};

interface EnquiryFormSettingsProps {
  userId: number;
}

const EnquiryFormSettings: React.FC<EnquiryFormSettingsProps> = ({ userId }) => {
  const { toast } = useToast();
  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [formAlias, setFormAlias] = useState("");
  const [formLink, setFormLink] = useState("");
  const [showCustomFieldsDialog, setShowCustomFieldsDialog] = useState(false);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  
  // Form styling and content
  const [hideBudgetField, setHideBudgetField] = useState(false);
  const [hideServingsField, setHideServingsField] = useState(false);
  const [hideDeliveryField, setHideDeliveryField] = useState(false);
  const [formInstructions, setFormInstructions] = useState(
    "Thank you so much for completing this enquiry form.\nThe more detail you are able to provide about your order, the faster and more accurately I can return a quote to you."
  );
  const [preSubmissionNotice, setPreSubmissionNotice] = useState(
    "Submitting this form does not book your order. We will reply as soon as possible to let you know if we have availability for your requested date. Please allow for up to 48 business hours for a reply."
  );
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");

  // Generate a form link when the component mounts or when form alias changes
  useEffect(() => {
    const baseUrl = window.location.origin;
    const uniqueId = generateUniqueId();
    
    // Use the alias if provided, otherwise use the unique ID
    const linkPath = formAlias ? formAlias : uniqueId;
    setFormLink(`${baseUrl}/enquiry-form/${linkPath}`);
  }, [formAlias]);

  // Generate a unique ID for the form
  const generateUniqueId = () => {
    return userId + "-" + Math.random().toString(36).substring(2, 15);
  };

  // Copy form link to clipboard
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(formLink)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Enquiry form link has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Failed to Copy",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      });
  };

  // Handle form alias update
  const handleAliasUpdate = () => {
    // In a real application, this would send an API request to update the alias
    toast({
      title: "Form Alias Updated",
      description: "Your enquiry form alias has been updated",
    });
  };

  // Toggle form enabled status
  const toggleFormEnabled = (checked: boolean) => {
    setIsFormEnabled(checked);
    // In a real application, this would update the setting in the database
    toast({
      title: checked ? "Form Enabled" : "Form Disabled",
      description: checked 
        ? "Your online enquiry form is now accessible to customers" 
        : "Your online enquiry form is now disabled",
    });
  };

  // Save custom field
  const saveCustomField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the custom field",
        variant: "destructive",
      });
      return;
    }

    if (!newFieldOptions.trim()) {
      toast({
        title: "Error",
        description: "Please provide at least one option for the dropdown",
        variant: "destructive",
      });
      return;
    }

    const options = newFieldOptions.split(',').map(option => option.trim()).filter(Boolean);
    
    if (options.length === 0) {
      toast({
        title: "Error",
        description: "Please provide valid options for the dropdown",
        variant: "destructive",
      });
      return;
    }

    if (editingFieldId) {
      // Update existing field
      setCustomFields(prevFields => 
        prevFields.map(field => 
          field.id === editingFieldId 
            ? { ...field, name: newFieldName, options }
            : field
        )
      );
      setEditingFieldId(null);
    } else {
      // Create new field
      const newField: CustomField = {
        id: Math.random().toString(36).substring(2, 9),
        name: newFieldName,
        type: "dropdown",
        options
      };
      setCustomFields(prev => [...prev, newField]);
    }

    // Reset form
    setNewFieldName("");
    setNewFieldOptions("");
    setShowCustomFieldsDialog(false);

    toast({
      title: editingFieldId ? "Field Updated" : "Field Added",
      description: editingFieldId 
        ? "Custom field has been updated successfully" 
        : "New custom field has been added successfully",
    });
  };

  // Edit a custom field
  const editCustomField = (field: CustomField) => {
    setEditingFieldId(field.id);
    setNewFieldName(field.name);
    setNewFieldOptions(field.options.join(', '));
    setShowCustomFieldsDialog(true);
  };

  // Delete a custom field
  const deleteCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== id));
    toast({
      title: "Field Deleted",
      description: "Custom field has been removed successfully",
    });
  };

  // Save form settings
  const saveFormSettings = () => {
    // In a real app, this would send an API request to save all settings
    toast({
      title: "Settings Saved",
      description: "Your enquiry form settings have been saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Enquiries
        </Button>
        <h1 className="text-2xl font-bold">Manage Enquiry Form</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Enable Enquiry Form</CardTitle>
            <CardDescription>
              Click below to either enable or disable your form. When it's disabled,
              your customers won't be able to access it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isFormEnabled} 
                onCheckedChange={toggleFormEnabled} 
                id="enable-form"
              />
              <Label htmlFor="enable-form">Enable Online Enquiry Form</Label>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Form Link</h3>
              <p className="text-sm text-gray-500 mb-2">
                You can add an alias for your enquiry form simply by entering it in
                the field below.
              </p>
              <div className="flex space-x-2 mb-4">
                <Input 
                  value={formAlias} 
                  onChange={(e) => setFormAlias(e.target.value)}
                  placeholder="Custom Form Alias" 
                />
                <Button onClick={handleAliasUpdate}>OK</Button>
              </div>

              <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
                <div className="text-sm break-all pr-2">{formLink}</div>
                <Button variant="ghost" size="sm" onClick={copyLinkToClipboard}>
                  <ClipboardIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-1">Did you know...</h3>
                <p className="text-sm text-gray-600">
                  You can copy & paste the link above and share it directly with your
                  customers making it easier for them to browse your products or send you
                  enquiries. You can also share this link on your facebook page, instagram
                  account or website.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customize Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customise your Form</CardTitle>
            <CardDescription>
              Choose to either show or hide the following fields from your enquiry
              form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={hideBudgetField} 
                  onCheckedChange={setHideBudgetField} 
                  id="hide-budget"
                />
                <Label htmlFor="hide-budget">Hide Budget Field</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={hideServingsField} 
                  onCheckedChange={setHideServingsField} 
                  id="hide-servings"
                />
                <Label htmlFor="hide-servings">Hide Servings Field</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={hideDeliveryField} 
                  onCheckedChange={setHideDeliveryField} 
                  id="hide-delivery"
                />
                <Label htmlFor="hide-delivery">Hide Collection / Delivery Field</Label>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Custom Fields</h3>
              <p className="text-sm text-gray-500 mb-4">
                You can add up to 10 custom dropdown options to your form where
                you can include options such as sizes, cake types, fillings, etc.
              </p>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingFieldId(null);
                  setNewFieldName("");
                  setNewFieldOptions("");
                  setShowCustomFieldsDialog(true);
                }}
              >
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Manage Custom Fields
              </Button>

              {customFields.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Your custom fields:</h4>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {customFields.map(field => (
                      <li key={field.id} className="flex items-center justify-between">
                        <span>{field.name} ({field.options.length} options)</span>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => editCustomField(field)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteCustomField(field.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Advanced Form Styling</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="bg-color">Background Color</Label>
                  <div className="flex items-center mt-1">
                    <div 
                      className="w-6 h-6 border border-gray-300 rounded mr-2" 
                      style={{ backgroundColor }}
                    />
                    <Input 
                      id="bg-color"
                      type="text" 
                      value={backgroundColor} 
                      onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center mt-1">
                    <div 
                      className="w-6 h-6 border border-gray-300 rounded mr-2" 
                      style={{ backgroundColor: textColor }}
                    />
                    <Input 
                      id="text-color"
                      type="text" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="form-instructions">Form Instructions:</Label>
                  <Textarea 
                    id="form-instructions"
                    value={formInstructions} 
                    onChange={(e) => setFormInstructions(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pre-submission">Pre Submission Notice:</Label>
                  <Textarea 
                    id="pre-submission"
                    value={preSubmissionNotice} 
                    onChange={(e) => setPreSubmissionNotice(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button className="w-full mt-6" onClick={saveFormSettings}>
                Save Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Fields Dialog */}
      <Dialog open={showCustomFieldsDialog} onOpenChange={setShowCustomFieldsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFieldId ? "Edit Custom Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              Add a custom dropdown field to your enquiry form
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="field-name">Field Name</Label>
              <Input 
                id="field-name"
                value={newFieldName} 
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g. Cake Size, Flavor, etc."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="field-options">
                Options (comma separated)
              </Label>
              <Textarea 
                id="field-options"
                value={newFieldOptions} 
                onChange={(e) => setNewFieldOptions(e.target.value)}
                placeholder="e.g. Small, Medium, Large"
                className="mt-1"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter options separated by commas, e.g. "Vanilla, Chocolate, Strawberry"
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomFieldsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomField}>
              {editingFieldId ? "Update" : "Add"} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnquiryFormSettings;