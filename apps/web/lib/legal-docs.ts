/**
 * Maps document version IDs to their corresponding URLs and metadata.
 */

export type LegalDocInfo = {
  id: string;
  url: string;
  label: string;
  requiresRole?: "PROFESSIONAL" | "STUDENT";
};

export const LEGAL_DOC_MAP: Record<string, LegalDocInfo> = {
  privacy_v2_20260913: {
    id: "privacy_v2_20260913",
    url: "/privacidade",
    label: "Política de Privacidade",
  },
  "privacy_v2_2026-09-13": {
    id: "privacy_v2_2026-09-13",
    url: "/privacidade",
    label: "Política de Privacidade",
  },
  terms_app_v2_20260913: {
    id: "terms_app_v2_20260913",
    url: "/termos",
    label: "Termos de Uso do Aplicativo",
  },
  "terms_app_v2_2026-09-13": {
    id: "terms_app_v2_2026-09-13",
    url: "/termos",
    label: "Termos de Uso do Aplicativo",
  },
  terms_saas_v2_20260913: {
    id: "terms_saas_v2_20260913",
    url: "/termos-saas",
    label: "Termos de Serviço SaaS",
    requiresRole: "PROFESSIONAL",
  },
  "terms_saas_v2_2026-09-13": {
    id: "terms_saas_v2_2026-09-13",
    url: "/termos-saas",
    label: "Termos de Serviço SaaS",
    requiresRole: "PROFESSIONAL",
  },
  payments_notice_v2_20260913: {
    id: "payments_notice_v2_20260913",
    url: "/aviso-pagamentos",
    label: "Aviso de Pagamentos",
    requiresRole: "PROFESSIONAL",
  },
  "payments_notice_v2_2026-09-13": {
    id: "payments_notice_v2_2026-09-13",
    url: "/aviso-pagamentos",
    label: "Aviso de Pagamentos",
    requiresRole: "PROFESSIONAL",
  },
};

export function getDocInfo(docVersionId: string): LegalDocInfo {
  return (
    LEGAL_DOC_MAP[docVersionId] || {
      id: docVersionId,
      url: "#",
      label: docVersionId,
    }
  );
}
