import { CompanyProfileSection } from "@/components/cadastros/company-profile-section";
import { PlatformHeader } from "@/components/platform-header";
import { useAuth } from "@/contexts/auth-context";
import { canViewCompanyProfileTab } from "@/services/auth";
import { getApiErrorMessage } from "@/services/api";
import {
  fetchMyCompanyProfile,
  updateMyCompanyProfile,
  type CompanyProfile,
} from "@/services/companies";
import { hideAppToast, showAppToast } from "@/services/toast";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COMPANY_CNPJ_MIN_LENGTH = 14;
const COMPANY_PHONE_MIN_LENGTH = 8;

type FeedbackTone = "error" | "success";

type CompanyFormErrors = {
  cnpj?: string;
  contactName?: string;
  contactPhone?: string;
  general?: string;
  name?: string;
};

function sanitizeCompanyName(value: string) {
  return value.replace(/\s+/g, " ");
}

function sanitizeCompanyCnpj(value: string) {
  return value.replace(/[^\d]/g, "");
}

function sanitizeCompanyPhone(value: string) {
  return value.replace(/[^\d()+\-\s]/g, "");
}

export default function CompanyTabScreen() {
  const { company, refreshSession, session, user } = useAuth();
  const canAccessCompanyProfile = canViewCompanyProfileTab(session);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyCnpjInput, setCompanyCnpjInput] = useState("");
  const [companyContactNameInput, setCompanyContactNameInput] = useState("");
  const [companyContactPhoneInput, setCompanyContactPhoneInput] = useState("");
  const [isLoadingCompanyProfile, setIsLoadingCompanyProfile] = useState(false);
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone | null>(null);
  const [companyFormErrors, setCompanyFormErrors] = useState<CompanyFormErrors>({});

  function clearFeedback() {
    setFeedbackMessage(null);
    setFeedbackTone(null);
    hideAppToast();
  }

  const showFeedback = useCallback((tone: FeedbackTone, message: string) => {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
    showAppToast({
      message,
      tone,
    });
  }, []);

  function clearCompanyFormErrors() {
    setCompanyFormErrors({});
  }

  function hydrateCompanyForm(profile: CompanyProfile) {
    setCompanyProfile(profile);
    setCompanyNameInput(profile.name ?? "");
    setCompanyCnpjInput(profile.cnpj ?? "");
    setCompanyContactNameInput(profile.contactName ?? "");
    setCompanyContactPhoneInput(profile.contactPhone ?? "");
  }

  const loadCompanyProfile = useCallback(async () => {
    setIsLoadingCompanyProfile(true);

    try {
      const response = await fetchMyCompanyProfile();
      hydrateCompanyForm(response);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Não foi possível carregar os dados da empresa."),
      );
    } finally {
      setIsLoadingCompanyProfile(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (!canAccessCompanyProfile) {
      return;
    }

    void loadCompanyProfile();
  }, [canAccessCompanyProfile, loadCompanyProfile]);

  function validateCompanyForm() {
    const nextErrors: CompanyFormErrors = {};
    const name = companyNameInput.trim().replace(/\s+/g, " ");
    const cnpj = sanitizeCompanyCnpj(companyCnpjInput).trim();
    const contactName = companyContactNameInput.trim().replace(/\s+/g, " ");
    const contactPhone = companyContactPhoneInput.trim();

    if (!name) {
      nextErrors.name = "Preencha o nome da empresa.";
    } else if (name.length < 3) {
      nextErrors.name = "Digite pelo menos 3 caracteres para o nome da empresa.";
    }

    if (!cnpj) {
      nextErrors.cnpj = "Preencha o CNPJ da empresa.";
    } else if (cnpj.length < COMPANY_CNPJ_MIN_LENGTH) {
      nextErrors.cnpj = "Informe o CNPJ completo da empresa.";
    }

    if (contactName && contactName.length < 3) {
      nextErrors.contactName =
        "Digite pelo menos 3 caracteres para o nome do responsável.";
    }

    if (contactPhone) {
      const digits = contactPhone.replace(/[^\d]/g, "");

      if (digits.length < COMPANY_PHONE_MIN_LENGTH) {
        nextErrors.contactPhone =
          "Informe um telefone válido ou deixe o campo em branco.";
      }
    }

    return {
      cnpj,
      contactName,
      contactPhone,
      isValid: Object.keys(nextErrors).length === 0,
      name,
      nextErrors,
    };
  }

  async function handleSubmitCompany() {
    const { cnpj, contactName, contactPhone, isValid, name, nextErrors } =
      validateCompanyForm();

    if (!isValid) {
      setCompanyFormErrors(nextErrors);
      showFeedback("error", "Revise os campos destacados antes de salvar a empresa.");
      return;
    }

    setIsSavingCompanyProfile(true);
    clearFeedback();
    clearCompanyFormErrors();

    try {
      const updatedCompany = await updateMyCompanyProfile({
        cnpj,
        contactName: contactName || undefined,
        contactPhone: contactPhone || undefined,
        name,
      });

      hydrateCompanyForm({
        ...(companyProfile ?? {}),
        ...updatedCompany,
      } as CompanyProfile);
      await refreshSession();
      showFeedback("success", `Dados da empresa ${name} atualizados com sucesso.`);
    } catch (error) {
      showFeedback(
        "error",
        getApiErrorMessage(error, "Não foi possível atualizar os dados da empresa."),
      );
    } finally {
      setIsSavingCompanyProfile(false);
    }
  }

  if (!canAccessCompanyProfile) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <PlatformHeader
              title="Empresa"
              subtitle="Esta área fica disponível apenas para administradores da empresa."
              detail={user?.email ?? "Sessão autenticada"}
            />

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Seu perfil não pode editar os dados da empresa.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                Apenas usuários `ADMIN` podem alterar o cadastro principal da empresa no app.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <View className="gap-5">
          <PlatformHeader
            title="Empresa"
            subtitle="Edite os dados principais da empresa, incluindo contato e informações do plano."
            detail={company?.name ?? user?.email ?? "Sessão autenticada"}
          />

          <CompanyProfileSection
            companyCnpjInput={companyCnpjInput}
            companyContactNameInput={companyContactNameInput}
            companyContactPhoneInput={companyContactPhoneInput}
            companyNameInput={companyNameInput}
            companyProfile={companyProfile}
            feedbackMessage={feedbackMessage}
            feedbackTone={feedbackTone}
            formErrorMessage={companyFormErrors.general}
            formErrors={companyFormErrors}
            isLoadingCompanyProfile={isLoadingCompanyProfile}
            isSavingCompanyProfile={isSavingCompanyProfile}
            onCnpjChange={(value) => {
              clearCompanyFormErrors();
              setCompanyCnpjInput(sanitizeCompanyCnpj(value));
            }}
            onContactNameChange={(value) => {
              clearCompanyFormErrors();
              setCompanyContactNameInput(sanitizeCompanyName(value));
            }}
            onContactPhoneChange={(value) => {
              clearCompanyFormErrors();
              setCompanyContactPhoneInput(sanitizeCompanyPhone(value));
            }}
            onNameChange={(value) => {
              clearCompanyFormErrors();
              setCompanyNameInput(sanitizeCompanyName(value));
            }}
            onRefresh={() => {
              clearFeedback();
              void loadCompanyProfile();
            }}
            onSubmit={() => {
              void handleSubmitCompany();
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
