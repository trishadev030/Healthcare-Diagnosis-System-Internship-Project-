import env from "../env";
import { GenerateAccesstoken } from "./GenerateAccessToken";
import * as Sentry from "@sentry/react-native";

const handleHttpError = async (response: Response, context: string): Promise<never> => {
  let serverMessage = "";
  try {
    const errData = await response.json();
    serverMessage = errData?.message || errData?.error || "";
  } catch {
    try {
      serverMessage = await response.text();
    } catch {}
  }

  // Report to Sentry
  Sentry.captureException(new Error(`${context} failed`), {
    level: "error",
    extra: {
      status: response.status,
      context,
      serverMessage,
      url: response.url,
    },
  });

  switch (response.status) {
    case 400:
      throw new Error(serverMessage || `Invalid request for ${context}. Please check your inputs.`);
    case 401:
      if (context === "ICD Lookup") {
        throw new Error("Please enter a valid ICD code.");
      }
      throw new Error("Session expired. Please log in again.");
    case 403:
      throw new Error("You do not have permission to perform this action.");
    case 404:
      if (context === "ICD Lookup") {
        throw new Error("Please enter a valid ICD code.");
      }
      throw new Error(`${context} not found. Please try again.`);
    case 422:
      if (context === "ICD Lookup") {
        throw new Error("Please enter a valid ICD code.");
      }
      throw new Error(serverMessage || "Invalid data. Please verify and try again.");
    case 500:
      throw new Error("Server error. Please try again later.");
    case 503:
      throw new Error("Service is temporarily unavailable. Please try again later.");
    default:
      if (context === "ICD Lookup") {
        throw new Error("Please enter a valid ICD code.");
      }
      throw new Error("Something went wrong. Please try again.");
  }
};

export const addDiagnosisCode = async (payload: {
  MemberID: string;
  Type: number;
  Date: string;
  ICDCode: string;
  Category: string;
  UserDescription: string;
}) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/AddDiagnosisCode`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        ProviderID:      env.FCAProvider_ID,
        LastUpdatedby:   env.FCAProvider_ID,
        MemberID:        payload.MemberID,
        Type:            payload.Type,
        Date:            payload.Date,
        ICDCode:         payload.ICDCode,
        Category:        payload.Category,
        UserDescription: payload.UserDescription,
      }),
    }
  );

  if (!response.ok) {
    await handleHttpError(response, "Add Diagnosis");
  }

  const data = await response.json();

  if (data.statusCode !== 200) {
    Sentry.captureException(new Error("Add Diagnosis failed"), {
      level: "warning",
      extra: { statusCode: data.statusCode, message: data.error },
    });
    throw new Error(data.error || "Failed to add diagnosis code");
  }

  return data;
};

export const icdLookup = async (icdCode: string) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/ICDLookup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        ICDCode: icdCode,
      }),
    }
  );

  if (!response.ok) {
    Sentry.captureException(new Error("ICD Lookup failed"), {
      level: "error",
      extra: { status: response.status, url: response.url },
    });
    throw new Error("Please enter a valid ICD code.");
  }

  const data = await response.json();

  if (data.statusCode !== 200) {
    Sentry.captureException(new Error("ICD Lookup invalid code"), {
      level: "warning",
      extra: { statusCode: data.statusCode, message: data.message },
    });
    throw new Error("Please enter a valid ICD code.");
  }

  return data;
};

export const manageDiagnosisDetails = async (encryptedMemberID: string) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/ManageDiagnosisDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        EncryptedMemberID:   encryptedMemberID,
        EncryptedProviderID: env.FCAProvider_ID,
      }),
    }
  );
  if (response.status === 404) {
    return [];
}

  if (!response.ok) {
    await handleHttpError(response, "Manage Diagnosis");
  }

  const data = await response.json();
  console.log("ManageDiagnosisDetails response:", JSON.stringify(data, null, 2));

  if (data.statusCode !== 200) {
    return []; // treat "no records" as empty list, not an error
  }

  return data.data;
};

export const editDiagnosis = async (encryptedID: string) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/GetIndividualDiagnosisDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        EncryptedID: encryptedID,
      }),
    }
  );

  if (!response.ok) {
    await handleHttpError(response, "Edit Diagnosis");
  }

  const data = await response.json();
  console.log("editDiagnosis raw response:", JSON.stringify(data, null, 2));

  if (data.statusCode !== 200) {
    Sentry.captureException(new Error("Edit Diagnosis failed"), {
      level: "warning",
      extra: { statusCode: data.statusCode, message: data.message },
    });
    throw new Error(data.message || "Failed to fetch diagnosis details");
  }

  return data.data[0];
};

export const updateDiagnosisDetails = async (payload: {
  encrypteddiagnosisrecordID: string;
  readingDate: string;
  ICDCode: string;
  Category: string;
  Description: string;
  type: string;
  AIInsight: string;
  UserDiagnosis: string;
}) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  console.log("updateDiagnosisDetails payload:", JSON.stringify(payload, null, 2));

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/UpdateDiagnosisDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        encrypteddiagnosisrecordID: payload.encrypteddiagnosisrecordID,
        readingDate:                payload.readingDate,
        ICDCode:                    payload.ICDCode,
        Category:                   payload.Category,
        Description:                payload.Description,
        type:                       payload.type,
        AIInsight:                  payload.AIInsight,
        UserDiagnosis:              payload.UserDiagnosis,
        LastUpdatedBy:              env.FCAProvider_ID,
      }),
    }
  );

  if (!response.ok) {
    await handleHttpError(response, "Update Diagnosis");
  }

  const data = await response.json();

  if (data.statusCode !== 200) {
    Sentry.captureException(new Error("Update Diagnosis failed"), {
      level: "warning",
      extra: { statusCode: data.statusCode, message: data.message },
    });
    throw new Error(data.message || "Failed to update diagnosis");
  }

  return data;
};

export const deleteDiagnosis = async (encrypteddiagnosisrecordID: string) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);

  if (!tokenData?.access_token) {
    throw new Error("Failed to generate access token");
  }

  const response = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/DeleteDiagnosisDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        encrypteddiagnosisrecordID,
      }),
    }
  );

  if (!response.ok) {
    await handleHttpError(response, "Delete Diagnosis");
  }

  const text = await response.text();
  console.log("deleteDiagnosis raw response:", text);
  const data = text ? JSON.parse(text) : {};

  if (data.statusCode !== 200) {
    Sentry.captureException(new Error("Delete Diagnosis failed"), {
      level: "warning",
      extra: { statusCode: data.statusCode, message: data.message },
    });
    throw new Error(data.message || "Failed to delete diagnosis");
  }

  return data;
};

export const generateAIInsight = async (payload: {
  encrypteddiagnosisrecordID: string;
  diagnosisCode: string;
  category: string;
  description: string;
  diagnosisType: string;
  userDiagnosis: string;
  readingDate: string;
}) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);
  if (!tokenData?.access_token) throw new Error("Failed to generate access token");

  const aiResponse = await fetch(`${env.AI_URL}ai/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestType:   "Insights for wellness",
      diagnosisCode: payload.diagnosisCode,
      category:      payload.category,
      description:   payload.description,
      userDiagnosis: payload.userDiagnosis,
    }),
  });

  if (!aiResponse.ok) {
    await handleHttpError(aiResponse, "AI Insight Generation");
  }

  const aiData = await aiResponse.json();
  console.log("AI raw response:", JSON.stringify(aiData, null, 2));
  const insightText = aiData.insight ?? aiData.content ?? aiData.data ?? aiData.result ?? "";

  const saveResponse = await fetch(
    `${env.API_URL}mblwhitelabelapiservice/UpdateDiagnosisDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        encrypteddiagnosisrecordID: payload.encrypteddiagnosisrecordID,
        readingDate:                payload.readingDate,
        ICDCode:                    payload.diagnosisCode,
        Category:                   payload.category,
        Description:                payload.description,
        type:                       payload.diagnosisType,
        AIInsight:                  insightText,
        UserDiagnosis:              payload.userDiagnosis,
        LastUpdatedBy:              env.FCAProvider_ID,
      }),
    }
  );

  if (!saveResponse.ok) {
    await handleHttpError(saveResponse, "Save AI Insight");
  }

  const saveData = await saveResponse.json();
  if (saveData.statusCode !== 200) {
    Sentry.captureException(new Error("Save AI Insight failed"), {
      level: "warning",
      extra: { statusCode: saveData.statusCode, message: saveData.message },
    });
    throw new Error(saveData.message || "Failed to save AI insight");
  }

  return insightText;
};

export const generateMultiAIInsight = async (diagnoses: {
  encryptedID: string;
  diagnosisCode: string;
  category: string;
  description: string;
  diagnosisType: string;
  userDiagnosis: string;
  readingDate: string;
}[]) => {
  const tokenData = await GenerateAccesstoken(env.FCAUserName, env.FCAPassword);
  if (!tokenData?.access_token) throw new Error("Failed to generate access token");

  const combinedDescription = diagnoses
    .map((d, i) => `${i + 1}. ${d.category} (${d.diagnosisCode}): ${d.description}`)
    .join('\n');

  const combinedCategories = diagnoses.map(d => d.category).join(', ');

  const aiResponse = await fetch(`${env.AI_URL}ai/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestType:   "Insights for wellness",
      diagnosisCode: diagnoses.map(d => d.diagnosisCode).join(', '),
      category:      combinedCategories,
      description:   combinedDescription,
      userDiagnosis: diagnoses.map(d => d.userDiagnosis).filter(Boolean).join(', '),
    }),
  });

  if (!aiResponse.ok) {
    await handleHttpError(aiResponse, "Multi AI Insight Generation");
  }

  const aiData = await aiResponse.json();
  const insightText = aiData.insight ?? aiData.content ?? aiData.data ?? aiData.result ?? "";

  const savePromises = diagnoses.map(d =>
    fetch(`${env.API_URL}mblwhitelabelapiservice/UpdateDiagnosisDetails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        encrypteddiagnosisrecordID: d.encryptedID,
        readingDate:                d.readingDate,
        ICDCode:                    d.diagnosisCode,
        Category:                   d.category,
        Description:                d.description,
        type:                       d.diagnosisType,
        AIInsight:                  insightText,
        UserDiagnosis:              d.userDiagnosis,
        LastUpdatedBy:              env.FCAProvider_ID,
      }),
    })
  );

 const results = await Promise.all(savePromises);
for (const res of results) {
  if (!res.ok) {
    Sentry.captureException(new Error("Multi AI Insight save failed"), {
      level: "warning",
      extra: { status: res.status, url: res.url },
    });
  }
}
return insightText;
};
