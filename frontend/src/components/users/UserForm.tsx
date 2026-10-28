
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import {
  RichTextEditorComponent,
  Toolbar,
  Link,
  HtmlEditor,
  QuickToolbar,
  Inject,
} from "@syncfusion/ej2-react-richtexteditor";

import "@syncfusion/ej2-material-theme/styles/material.css";

import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";

import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

import type { User, UserFile, Department } from "../../types";
import { getDepartments } from "../../services/departmentService";
import {
  validateUser,
  validateProfilePicture,
  validateDocument,
} from "../../utils/validation";
import { getFileUrl } from "../../utils/fileUtils";

import "./UserForm.css";

interface UserFormValues {
  name: string;
  email: string;
  age: string | number;
  city: string;
  joined_date: string;
  gender: "" | "Male" | "Female" | "Other";
  department_id: string | number;
  is_active: boolean;
  address: string;
  profile_picture: File | null;
  document: File | null;
}

interface UserFormProps {
  user?: User | null;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
}

interface FormikSubmitHelpers {
  setSubmitting: (isSubmitting: boolean) => void;
  setStatus: (status?: unknown) => void;
}

const INITIAL_VALUES: UserFormValues = {
  name: "",
  email: "",
  age: "",
  city: "",
  joined_date: "",
  gender: "",
  department_id: "",
  is_active: true,
  address: "",
  profile_picture: null,
  document: null,
};

const MAX_ADDRESS_LENGTH = 5000;

function normalizeDateForInput(value?: string | null): string {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFilePath(
  value?: string | UserFile | null,
): string | null {
  if (typeof value === "string") return value;
  return value?.file_path ?? null;
}

function buildInitialValues(user?: User | null): UserFormValues {
  if (!user) return { ...INITIAL_VALUES };

  return {
    name: user.name ?? "",
    email: user.email ?? "",
    age: user.age ?? "",
    city: user.city ?? "",
    joined_date: normalizeDateForInput(user.joined_date),
    gender: user.gender ?? "",
    department_id: user.department_id ?? "",
    is_active: user.is_active === undefined
      ? true
      : Boolean(user.is_active),
    address: user.address ?? "",
    profile_picture: null,
    document: null,
  };
}

function buildFormData(values: UserFormValues): FormData {
  const formData = new FormData();

  formData.append("name", values.name.trim());
  formData.append("email", values.email.trim());
  formData.append("is_active", values.is_active ? "1" : "0");

  if (values.age !== "") {
    formData.append("age", String(values.age));
  }

  if (values.city.trim()) {
    formData.append("city", values.city.trim());
  }

  if (values.joined_date) {
    formData.append("joined_date", values.joined_date);
  }

  if (values.gender) {
    formData.append("gender", values.gender);
  }

  if (values.department_id !== "") {
    formData.append("department_id", String(values.department_id));
  }

  if (values.address) {
    formData.append("address", values.address);
  }

  if (values.profile_picture) {
    formData.append("profile_picture", values.profile_picture);
  }

  if (values.document) {
    formData.append("document", values.document);
  }

  return formData;
}

export default function UserForm({
  user = null,
  onSubmit,
  onCancel,
  submitting = false,
}: UserFormProps) {
  const isEditing = Boolean(user);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("");

  const initialValues = useMemo(
    () => buildInitialValues(user),
    [user],
  );

  const existingProfilePictureUrl = useMemo(() => {
    const path = getFilePath(user?.profile_picture)
      ?? user?.files?.find(
        (file) => file.file_type === "profile_picture",
      )?.file_path
      ?? null;

    return path ? getFileUrl(path) : null;
  }, [user]);

  const existingDocumentPath = useMemo(() => {
    return getFilePath(user?.document)
      ?? user?.files?.find(
        (file) => file.file_type === "document",
      )?.file_path
      ?? null;
  }, [user]);

  const existingDocumentUrl = existingDocumentPath
    ? getFileUrl(existingDocumentPath)
    : null;

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      setDepartmentsLoading(true);
      setDepartmentsError(null);

      try {
        const result = await getDepartments();

        if (mounted) setDepartments(result);
      } catch (error: unknown) {
        if (mounted) {
          setDepartmentsError(
            error instanceof Error
              ? error.message
              : "Failed to load departments.",
          );
        }
      } finally {
        if (mounted) setDepartmentsLoading(false);
      }
    }

    void loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setProfilePreview(null);
    setDocumentName("");
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (profilePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  function handleProfilePictureChange(
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: unknown,
    ) => Promise<unknown>,
    setFieldError: (field: string, message?: string) => void,
  ) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const validationError = validateProfilePicture(file);

    if (validationError) {
      setFieldError("profile_picture", validationError);
      event.currentTarget.value = "";
      return;
    }

    setFieldError("profile_picture", undefined);

    setProfilePreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });

    void setFieldValue("profile_picture", file);
  }

  function handleDocumentChange(
    event: ChangeEvent<HTMLInputElement>,
    setFieldValue: (
      field: string,
      value: unknown,
    ) => Promise<unknown>,
    setFieldError: (field: string, message?: string) => void,
  ) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    const validationError = validateDocument(file);

    if (validationError) {
      setFieldError("document", validationError);
      setDocumentName("");
      event.currentTarget.value = "";
      return;
    }

    setFieldError("document", undefined);
    setDocumentName(file.name);
    void setFieldValue("document", file);
  }

  async function handleSubmit(
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>,
  ) {
    try {
      helpers.setStatus(undefined);
      await onSubmit(buildFormData(values));
    } catch (error: unknown) {
      helpers.setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save user.",
      );
    } finally {
      helpers.setSubmitting(false);
    }
  }

  return (
    <Formik<UserFormValues>
      initialValues={initialValues}
      enableReinitialize
      validate={(values) => validateUser(values)}
      onSubmit={handleSubmit}
    >
      {({
        errors,
        touched,
        setFieldValue,
        setFieldError,
        isSubmitting,
        status,
      }) => {
        const submittingForm = submitting || isSubmitting;

        return (
          <Form className="user-form" noValidate>
            <div className="user-form-header">
              <div>
                <h2>{isEditing ? "Edit User" : "Add User"}</h2>
                <p>
                  {isEditing
                    ? "Update the user's information and files."
                    : "Create a new user profile."}
                </p>
              </div>

              {onCancel && (
                <button
                  type="button"
                  className="form-close-button"
                  onClick={onCancel}
                  disabled={submittingForm}
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {status && (
              <div className="form-status-error" role="alert">
                {String(status)}
              </div>
            )}

            <section className="form-section">
              <div className="form-section-header">
                <h3>Personal Information</h3>
                <span>Required fields are marked *</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <Field id="name" name="name" type="text" />
                  <ErrorMessage name="name" component="div" className="field-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <Field id="email" name="email" type="email" />
                  <ErrorMessage name="email" component="div" className="field-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <Field id="age" name="age" type="number" min="1" max="120" />
                  <ErrorMessage name="age" component="div" className="field-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <Field id="city" name="city" type="text" />
                  <ErrorMessage name="city" component="div" className="field-error" />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <Field as="select" id="gender" name="gender">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Field>
                </div>

                <div className="form-group">
                  <label htmlFor="department_id">Department</label>
                  <Field
                    as="select"
                    id="department_id"
                    name="department_id"
                    disabled={departmentsLoading}
                  >
                    <option value="">
                      {departmentsLoading
                        ? "Loading departments..."
                        : "Select department"}
                    </option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </Field>

                  {departmentsError && (
                    <div className="field-error" role="alert">
                      {departmentsError}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="joined_date">Joined Date</label>
                  <div className="input-with-icon">
                    <CalendarDays size={18} />
                    <Field id="joined_date" name="joined_date" type="date" />
                  </div>
                </div>

                <div className="form-group form-checkbox-group">
                  <label className="checkbox-label">
                    <Field type="checkbox" name="is_active" />
                    <span>Is active</span>
                  </label>
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-header">
                <h3>Address</h3>
                <span>Rich text supported</span>
              </div>

              <Field name="address">
                {({ field }: { field: { value: string } }) => (
                  <RichTextEditorComponent
                    id="address"
                    value={field.value || ""}
                    height="250px"
                    placeholder="Enter user address..."
                    toolbarSettings={{
                      items: [
                        "Undo", "Redo", "|",
                        "Bold", "Italic", "Underline", "StrikeThrough", "|",
                        "FontName", "FontSize", "Formats", "|",
                        "FontColor", "BackgroundColor", "|",
                        "Alignments", "|",
                        "OrderedList", "UnorderedList", "Outdent", "Indent", "|",
                        "CreateLink", "|",
                        "ClearFormat", "FullScreen",
                      ],
                    }}
                    change={(args) => {
                      const html = args.value || "";
                      const plainText = html.replace(/<[^>]*>/g, "").trim();

                      if (plainText.length <= MAX_ADDRESS_LENGTH) {
                        void setFieldValue("address", html);
                      }
                    }}
                  >
                    <Inject
                      services={[Toolbar, Link, HtmlEditor, QuickToolbar]}
                    />
                  </RichTextEditorComponent>
                )}
              </Field>

              <ErrorMessage name="address" component="div" className="field-error" />
            </section>

            <section className="form-section">
              <div className="form-section-header">
                <h3>Files</h3>
                <span>Optional</span>
              </div>

              <div className="file-upload-grid">
                <div className="file-upload-card">
                  <div className="file-upload-header">
                    <div>
                      <h4>Profile Picture</h4>
                      <p>JPG, PNG or WEBP</p>
                    </div>
                    <ImageIcon size={20} />
                  </div>

                  <div className="profile-upload-area">
                    {profilePreview || existingProfilePictureUrl ? (
                      <img
                        src={profilePreview || existingProfilePictureUrl || ""}
                        alt="Profile preview"
                        className="profile-preview"
                      />
                    ) : (
                      <div className="profile-upload-placeholder">
                        <ImageIcon size={32} />
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>

                  <div className="file-upload-actions">
                    <label htmlFor="profile_picture" className="file-upload-button">
                      <Upload size={16} />
                      Choose Image
                      <input
                        id="profile_picture"
                        name="profile_picture"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={(event) =>
                          handleProfilePictureChange(
                            event,
                            setFieldValue,
                            setFieldError,
                          )
                        }
                      />
                    </label>

                    {profilePreview && (
                      <button
                        type="button"
                        className="file-remove-button"
                        onClick={() => {
                          void setFieldValue("profile_picture", null);
                          setProfilePreview(null);
                        }}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    )}
                  </div>

                  <ErrorMessage name="profile_picture" component="div" className="field-error" />
                </div>

                <div className="file-upload-card">
                  <div className="file-upload-header">
                    <div>
                      <h4>Document</h4>
                      <p>PDF, DOC or DOCX</p>
                    </div>
                    <FileText size={20} />
                  </div>

                  <div className="document-preview">
                    {documentName ? (
                      <>
                        <FileText size={34} />
                        <span>{documentName}</span>
                      </>
                    ) : existingDocumentUrl ? (
                      <a
                        href={existingDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="existing-document-link"
                      >
                        <FileText size={22} />
                        View existing document
                      </a>
                    ) : (
                      <span>No document selected</span>
                    )}
                  </div>

                  <div className="file-upload-actions">
                    <label htmlFor="document" className="file-upload-button">
                      <Upload size={16} />
                      Choose Document
                      <input
                        id="document"
                        name="document"
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        hidden
                        onChange={(event) =>
                          handleDocumentChange(
                            event,
                            setFieldValue,
                            setFieldError,
                          )
                        }
                      />
                    </label>

                    {documentName && (
                      <button
                        type="button"
                        className="file-remove-button"
                        onClick={() => {
                          void setFieldValue("document", null);
                          setDocumentName("");
                        }}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    )}
                  </div>

                  <ErrorMessage name="document" component="div" className="field-error" />
                </div>
              </div>
            </section>

            <div className="user-form-actions">
              {onCancel && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onCancel}
                  disabled={submittingForm}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={submittingForm}
              >
                {submittingForm
                  ? "Saving..."
                  : isEditing
                    ? "Update User"
                    : "Create User"}
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
