import { ENV } from "../_core/env";

const ZENODO_API = "https://zenodo.org/api";

interface ZenodoDeposit {
  id: number;
  doi: string;
  doi_url: string;
  links: {
    html: string;
    publish: string;
    edit: string;
    files: string;
    bucket: string;
  };
  metadata: Record<string, any>;
}

export async function createZenodoDeposit(params: {
  title: string;
  description: string;
  authors: { name: string; affiliation?: string; orcid?: string }[];
  keywords?: string[];
}): Promise<ZenodoDeposit> {
  const creators = params.authors.map(a => ({
    name: a.name,
    affiliation: a.affiliation || "",
    orcid: a.orcid || ENV.zenodoOrcid || undefined,
  }));

  const response = await fetch(`${ZENODO_API}/deposit/depositions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.zenodoApiToken}`,
    },
    body: JSON.stringify({
      metadata: {
        title: params.title,
        upload_type: "publication",
        publication_type: "article",
        description: params.description || params.title,
        creators,
        keywords: params.keywords || [],
        access_right: "open",
        license: "cc-by-4.0",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zenodo deposit creation failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function uploadFileToZenodo(depositId: number, bucketUrl: string, fileName: string, fileContent: Buffer | string) {
  const body = typeof fileContent === 'string' ? fileContent : new Uint8Array(fileContent);
  const response = await fetch(`${bucketUrl}/${fileName}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization: `Bearer ${ENV.zenodoApiToken}`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zenodo file upload failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function publishZenodoDeposit(depositId: number): Promise<ZenodoDeposit> {
  const response = await fetch(`${ZENODO_API}/deposit/depositions/${depositId}/actions/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.zenodoApiToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zenodo publish failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function getZenodoDeposit(depositId: number): Promise<ZenodoDeposit> {
  const response = await fetch(`${ZENODO_API}/deposit/depositions/${depositId}`, {
    headers: {
      Authorization: `Bearer ${ENV.zenodoApiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Zenodo deposit: ${response.status}`);
  }

  return response.json();
}
