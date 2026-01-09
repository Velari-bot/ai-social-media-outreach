"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams?.get("demo") === "true";

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", subject: "", body: "" });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserAndTemplates() {
      try {
        if (isDemo) {
          // Mock templates data for Demo
          const mockTemplates: EmailTemplate[] = [
            {
              id: "1",
              name: "Initial Outreach - Tech",
              subject: "Collaboration Opportunity - {{creatorName}}",
              body: "Hi {{creatorName}},\n\nI came across your {{platform}} channel and love your content about {{topic}}. We're looking for creators like you to collaborate with.\n\nOur product is {{productDescription}} and we think it would be a great fit for your audience.\n\nWould you be interested in learning more? I'd love to discuss potential collaboration opportunities.\n\nBest regards,\n{{yourName}}",
              isDefault: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Follow-up - Budget Discussion",
              subject: "Re: Collaboration Opportunity - Budget Details",
              body: "Hi {{creatorName}},\n\nFollowing up on our previous conversation about collaboration. I wanted to share more details about our budget and what we're looking for:\n\n• Budget: ${{budgetRange}}\n• Deliverables: {{deliverables}}\n• Timeline: {{timeline}}\n\nLet me know if this works for you or if you'd like to discuss any adjustments.\n\nLooking forward to working together!\n\nBest,\n{{yourName}}",
              isDefault: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Quick Intro",
              subject: "Quick question - {{platform}} collaboration",
              body: "Hi {{creatorName}},\n\nQuick question - are you currently accepting brand partnership opportunities?\n\nWe'd love to work with you if you're interested.\n\nThanks!\n{{yourName}}",
              isDefault: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];

          setTemplates(mockTemplates);
          if (mockTemplates.length > 0) {
            setSelectedTemplate(mockTemplates[0]);
          }
          setLoading(false);
          return;
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        setUserId(user.id);

        // Mock templates data (in production, this would come from a database table)
        // ... (rest of the code)
        const mockTemplates: EmailTemplate[] = [
          {
            id: "1",
            name: "Initial Outreach - Tech",
            subject: "Collaboration Opportunity - {{creatorName}}",
            body: "Hi {{creatorName}},\n\nI came across your {{platform}} channel and love your content about {{topic}}. We're looking for creators like you to collaborate with.\n\nOur product is {{productDescription}} and we think it would be a great fit for your audience.\n\nWould you be interested in learning more? I'd love to discuss potential collaboration opportunities.\n\nBest regards,\n{{yourName}}",
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Follow-up - Budget Discussion",
            subject: "Re: Collaboration Opportunity - Budget Details",
            body: "Hi {{creatorName}},\n\nFollowing up on our previous conversation about collaboration. I wanted to share more details about our budget and what we're looking for:\n\n• Budget: ${{budgetRange}}\n• Deliverables: {{deliverables}}\n• Timeline: {{timeline}}\n\nLet me know if this works for you or if you'd like to discuss any adjustments.\n\nLooking forward to working together!\n\nBest,\n{{yourName}}",
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Quick Intro",
            subject: "Quick question - {{platform}} collaboration",
            body: "Hi {{creatorName}},\n\nQuick question - are you currently accepting brand partnership opportunities?\n\nWe'd love to work with you if you're interested.\n\nThanks!\n{{yourName}}",
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        setTemplates(mockTemplates);
        if (mockTemplates.length > 0) {
          setSelectedTemplate(mockTemplates[0]);
        }
      } catch (error: any) {
        console.error("Error loading templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    loadUserAndTemplates();
  }, [router]);

  const handleSaveTemplate = () => {
    if (!editForm.name || !editForm.subject || !editForm.body) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isCreating) {
      const newTemplate: EmailTemplate = {
        id: Date.now().toString(),
        name: editForm.name,
        subject: editForm.subject,
        body: editForm.body,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTemplates([...templates, newTemplate]);
      setSelectedTemplate(newTemplate);
      toast.success("Template created!");
    } else if (selectedTemplate) {
      const updated = templates.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, name: editForm.name, subject: editForm.subject, body: editForm.body, updatedAt: new Date().toISOString() }
          : t
      );
      setTemplates(updated);
      setSelectedTemplate({ ...selectedTemplate, ...editForm, updatedAt: new Date().toISOString() });
      toast.success("Template updated!");
    }

    setIsEditing(false);
    setIsCreating(false);
    setEditForm({ name: "", subject: "", body: "" });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(templates.find(t => t.id !== templateId) || null);
      }
      toast.success("Template deleted");
    }
  };

  const handleEditClick = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setIsEditing(true);
  };

  const handleCreateClick = () => {
    setEditForm({ name: "", subject: "", body: "" });
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({ name: "", subject: "", body: "" });
    if (selectedTemplate) {
      setEditForm({
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EF] font-sans">
      <Navbar />

      <div className="w-full px-4 sm:px-6 pt-24 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Email Templates</h1>
                <p className="text-lg text-gray-700">
                  Manage your email outreach templates
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={handleCreateClick}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Template
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Templates List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {templates.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedTemplate(template);
                          setEditForm({
                            name: template.name,
                            subject: template.subject,
                            body: template.body,
                          });
                          setIsEditing(false);
                          setIsCreating(false);
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedTemplate?.id === template.id ? "bg-gray-50 border-l-4 border-black" : ""
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-black mb-1">{template.name}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{template.subject}</div>
                          </div>
                          {template.isDefault && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-600">No templates yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                {isCreating || (selectedTemplate && isEditing) ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black text-black"
                        placeholder="e.g., Initial Outreach - Tech"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={editForm.subject}
                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black text-black"
                        placeholder="e.g., Collaboration Opportunity - {{creatorName}}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use variables like {"{{"}creatorName{"}}"}, {"{{"}platform{"}}"}, {"{{"}topic{"}}"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={editForm.body}
                        onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                        rows={12}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-black text-black font-mono text-sm"
                        placeholder="Write your email template here..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveTemplate}
                        className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium"
                      >
                        {isCreating ? "Create Template" : "Save Changes"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-6 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selectedTemplate ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-black mb-1">{selectedTemplate.name}</h3>
                        {selectedTemplate.isDefault && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(selectedTemplate)}
                          className="px-4 py-2 bg-white border border-gray-200 text-black rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        {!selectedTemplate.isDefault && (
                          <button
                            onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Subject</div>
                      <div className="text-base font-medium text-black bg-gray-50 rounded-lg p-3">
                        {selectedTemplate.subject}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Body</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 min-h-[300px] font-mono">
                        {selectedTemplate.body}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(selectedTemplate.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 mb-4">Select a template to view or create a new one</p>
                    <button
                      onClick={handleCreateClick}
                      className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                      Create Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

