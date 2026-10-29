
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import {
  Formik,
  Form,
  Field,
  ErrorMessage,
} from "formik";
import type { FormikHelpers } from "formik";

import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  RichTextEditorComponent,
  Toolbar,
  Link,
  HtmlEditor,
  QuickToolbar,
  Inject,
} from "@syncfusion/ej2-react-richtexteditor";

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

import "./UserForm.scss";

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
  user: User | null;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
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

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateForInput(
  value?: string | null,
): string {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFilePath(
  value?: string | UserFile | null,
): string | null {
  if (typeof value === "string") {
    return value || null;
  }

  return value?.file_path ?? null;
}

function buildInitialValues(
  user: User | null,
): UserFormValues {
  if (!user) {
    return {
      ...INITIAL_VALUES,
      joined_date: getLocalDate(),
    };
  }

  return {
    name: user.name ?? "",
    email: user.email ?? "",
    age: user.age ?? "",
    city: user.city ?? "",
    joined_date: normalizeDateForInput(user.joined_date),
    gender: user.gender ?? "",
    department_id: user.department_id ?? "",
    is_active:
      user.is_active === undefined
        ? true
        : Boolean(user.is_active),
    address: user.address ?? "",
    profile_picture: null,
    document: null,
  };
}

function buildFormData(
  values: UserFormValues,
): FormData {
  const formData = new FormData();

  formData.append("name", values.name.trim());
  formData.append("email", values.email.trim());
  formData.append(
    "is_active",
    values.is_active ? "1" : "0",
  );

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
    formData.append(
      "department_id",
      String(values.department_id),
    );
  }

  if (values.address) {
    formData.append("address", values.address);
  }

  if (values.profile_picture) {
    formData.append(
      "profile_picture",
      values.profile_picture,
    );
  }

  if (values.document) {
    formData.append("document", values.document);
  }

  return formData;
}

export default function UserForm({
  user,
  onSubmit,
  onCancel,
  submitting,
}: UserFormProps) {
  const isEditing = Boolean(user);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] =
    useState<boolean>(true);
  const [departmentsError, setDepartmentsError] =
    useState<string | null>(null);

  const [profilePreview, setProfilePreview] =
    useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>("");

  const initialValues = useMemo(
    () => buildInitialValues(user),
    [user],
  );

  const existingProfilePictureUrl = useMemo(() => {
    const path =
      getFilePath(user?.profile_picture) ??
      user?.files?.find(
        (file) => file.file_type === "profile_picture",
      )?.file_path ??
      null;

    return path ? getFileUrl(path) : null;
  }, [user]);

  const existingDocumentUrl = useMemo(() => {
    const path =
      getFilePath(user?.document) ??
      user?.files?.find(
        (file) => file.file_type === "document",
      )?.file_path ??
      null;

    return path ? getFileUrl(path) : null;
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadDepartments(): Promise<void> {
      setDepartmentsLoading(true);
      setDepartmentsError(null);

      try {
        const result = await getDepartments();

        if (mounted) {
          setDepartments(result);
        }
      } catch (error: unknown) {
        if (mounted) {
          setDepartmentsError(
            error instanceof Error
              ? error.message
              : "Failed to load departments.",
          );
        }
      } finally {
        if (mounted) {
          setDepartmentsLoading(false);
        }
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
    setFieldError: (
      field: string,
      message?: string,
    ) => void,
  ): void {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const validationError = validateProfilePicture(file);

    if (validationError) {
      setFieldError("profile_picture", validationError);
      input.value = "";
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
    setFieldError: (
      field: string,
      message?: string,
    ) => void,
  ): void {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const validationError = validateDocument(file);

    if (validationError) {
      setFieldError("document", validationError);
      input.value = "";
      return;
    }

    setFieldError("document", undefined);
    setDocumentName(file.name);

    void setFieldValue("document", file);
  }

  async function handleSubmit(
    values: UserFormValues,
    helpers: FormikHelpers<UserFormValues>,
  ): Promise<void> {
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
        setFieldValue,
        setFieldError,
        isSubmitting,
        status,
        values,
        errors,
        touched,
      }) => {
        const isSaving = submitting || isSubmitting;

        return (
          <Form className="user-form" noValidate>
            <Box className="user-form__header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
                  {isEditing ? "Edit User" : "Add User"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {isEditing
                    ? "Update the user's information and files."
                    : "Create a new user profile."}
                </Typography>
              </Box>

              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={onCancel}
                disabled={isSaving}
                aria-label="Close form"
                sx={{ minWidth: 0, width: 40, height: 40, borderRadius: "50%", p: 0 }}
              >
                <X size={20} />
              </Button>
            </Box>

            {status && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {String(status)}
              </Alert>
            )}

            <section className="user-form__section">
              <Box className="user-form__section-heading" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Personal Information</Typography>
                <Typography variant="caption" color="text.secondary">Required fields are marked *</Typography>
              </Box>

              <Box className="user-form__grid" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="name"
                    name="name"
                    label="Full Name"
                    required
                    fullWidth
                    autoComplete="name"
                    placeholder="Enter full name"
                    value={values.name}
                    error={Boolean(touched.name && errors.name)}
                    helperText={<ErrorMessage name="name" />}
                  />
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="email"
                    name="email"
                    label="Email Address"
                    required
                    fullWidth
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={values.email}
                    error={Boolean(touched.email && errors.email)}
                    helperText={<ErrorMessage name="email" />}
                  />
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="age"
                    name="age"
                    label="Age"
                    fullWidth
                    type="number"
                    inputProps={{ min: 1, max: 120 }}
                    placeholder="Enter age"
                    value={values.age}
                    error={Boolean(touched.age && errors.age)}
                    helperText={<ErrorMessage name="age" />}
                  />
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="city"
                    name="city"
                    label="City"
                    fullWidth
                    placeholder="Enter city"
                    value={values.city}
                    error={Boolean(touched.city && errors.city)}
                    helperText={<ErrorMessage name="city" />}
                  />
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="gender"
                    name="gender"
                    label="Gender"
                    select
                    fullWidth
                    value={values.gender}
                    error={Boolean(touched.gender && errors.gender)}
                    helperText={<ErrorMessage name="gender" />}
                  >
                    <MenuItem value="">Select gender</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Field>
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="department_id"
                    name="department_id"
                    label="Department"
                    select
                    fullWidth
                    disabled={departmentsLoading}
                    value={values.department_id}
                    error={Boolean(touched.department_id && errors.department_id)}
                    helperText={
                      departmentsError ? (
                        <span role="alert">{departmentsError}</span>
                      ) : (
                        <ErrorMessage name="department_id" />
                      )
                    }
                  >
                    <MenuItem value="">
                      {departmentsLoading ? "Loading departments..." : "Select department"}
                    </MenuItem>

                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Field>
                </Box>

                <Box className="user-form__field">
                  <Field
                    as={TextField}
                    id="joined_date"
                    name="joined_date"
                    label="Joined Date"
                    type="date"
                    fullWidth
                    value={values.joined_date}
                    error={Boolean(touched.joined_date && errors.joined_date)}
                    helperText={<ErrorMessage name="joined_date" />}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarDays size={18} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box className="user-form__field user-form__active-field" sx={{ display: "flex", alignItems: "center" }}>
                  <FormControlLabel
                    control={
                      <Field as={Checkbox} type="checkbox" name="is_active" checked={values.is_active} />
                    }
                    label="Account is active"
                  />
                </Box>
              </Box>
            </section>

            {/* Rich-text address */}
            <section className="user-form__section">
              <div className="user-form__section-heading">
                <h3>Address</h3>
                <span>Rich-text editor</span>
              </div>

              <RichTextEditorComponent
                id="address"
                value={values.address}
                height="250px"
                placeholder="Enter user address..."
                toolbarSettings={{
                  items: [
                    "Undo",
                    "Redo",
                    "|",
                    "Bold",
                    "Italic",
                    "Underline",
                    "StrikeThrough",
                    "|",
                    "FontName",
                    "FontSize",
                    "Formats",
                    "|",
                    "FontColor",
                    "BackgroundColor",
                    "|",
                    "Alignments",
                    "|",
                    "OrderedList",
                    "UnorderedList",
                    "Outdent",
                    "Indent",
                    "|",
                    "CreateLink",
                    "|",
                    "ClearFormat",
                    "FullScreen",
                  ],
                }}
                change={(args) => {
                  const html = args.value ?? "";
                  const plainText = html
                    .replace(/<[^>]*>/g, "")
                    .trim();

                  if (plainText.length <= MAX_ADDRESS_LENGTH) {
                    void setFieldValue("address", html);
                  }
                }}
              >
                <Inject
                  services={[
                    Toolbar,
                    Link,
                    HtmlEditor,
                    QuickToolbar,
                  ]}
                />
              </RichTextEditorComponent>

              <ErrorMessage
                name="address"
                component="div"
                className="user-form__field-error"
              />
            </section>

            {/* File uploads */}
            <section className="user-form__section">
              <div className="user-form__section-heading">
                <h3>Files and Documents</h3>
                <span>Optional</span>
              </div>

              <div className="user-form__upload-grid">
                {/* Profile picture */}
                <div className="user-form__upload-card">
                  <div className="user-form__upload-heading">
                    <div>
                      <h4>Profile Picture</h4>
                      <p>JPG, PNG or WEBP</p>
                    </div>
                    <ImageIcon size={21} />
                  </div>

                  <div className="user-form__profile-preview">
                    {profilePreview ||
                    existingProfilePictureUrl ? (
                      <img
                        src={
                          profilePreview ??
                          existingProfilePictureUrl ??
                          ""
                        }
                        alt="Profile preview"
                      />
                    ) : (
                      <div className="user-form__placeholder">
                        <ImageIcon size={32} />
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>

                  <Stack direction="row" spacing={1} className="user-form__file-actions" sx={{ flexWrap: "wrap" }}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<Upload size={16} />}
                      htmlFor="profile_picture"
                    >
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
                    </Button>

                    {profilePreview && (
                      <Button
                        type="button"
                        variant="text"
                        color="inherit"
                        onClick={() => {
                          void setFieldValue(
                            "profile_picture",
                            null,
                          );
                          setProfilePreview(null);

                          const input =
                            document.getElementById(
                              "profile_picture",
                            ) as HTMLInputElement | null;

                          if (input) input.value = "";
                        }}
                        startIcon={<X size={15} />}
                      >
                        Clear selection
                      </Button>
                    )}
                  </Stack>

                  <ErrorMessage
                    name="profile_picture"
                    component="div"
                    className="user-form__field-error"
                  />
                </div>

                {/* Document */}
                <div className="user-form__upload-card">
                  <div className="user-form__upload-heading">
                    <div>
                      <h4>Document</h4>
                      <p>PDF, DOC or DOCX</p>
                    </div>
                    <FileText size={21} />
                  </div>

                  <div className="user-form__document-preview">
                    {documentName ? (
                      <>
                        <FileText size={30} />
                        <span>{documentName}</span>
                      </>
                    ) : existingDocumentUrl ? (
                      <a
                        href={existingDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText size={21} />
                        View existing document
                      </a>
                    ) : (
                      <span>No document selected</span>
                    )}
                  </div>

                  <Stack direction="row" spacing={1} className="user-form__file-actions" sx={{ flexWrap: "wrap" }}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<Upload size={16} />}
                      htmlFor="document"
                    >
                      Choose Document

                      <input
                        id="document"
                        name="document"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        hidden
                        onChange={(event) =>
                          handleDocumentChange(
                            event,
                            setFieldValue,
                            setFieldError,
                          )
                        }
                      />
                    </Button>

                    {documentName && (
                      <Button
                        type="button"
                        variant="text"
                        color="inherit"
                        onClick={() => {
                          void setFieldValue("document", null);
                          setDocumentName("");

                          const input =
                            document.getElementById(
                              "document",
                            ) as HTMLInputElement | null;

                          if (input) input.value = "";
                        }}
                        startIcon={<X size={15} />}
                      >
                        Clear selection
                      </Button>
                    )}
                  </Stack>

                  <ErrorMessage
                    name="document"
                    component="div"
                    className="user-form__field-error"
                  />
                </div>
              </div>
            </section>

            {/* Form actions */}
            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : isEditing
                    ? "Update User"
                    : "Create User"}
              </Button>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
}
