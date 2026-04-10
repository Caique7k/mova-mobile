import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { FeedbackBanner, SectionHeader, SummaryCard } from "@/components/cadastros/ui";
import type { CompanyProfile } from "@/services/companies";
import {
  Building2,
  CalendarDays,
  ContactRound,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  ShieldCheck,
  UsersRound,
} from "lucide";
import { Text, View } from "react-native";

function formatDate(value?: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatCount(value?: number) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="mt-0.5 rounded-2xl bg-tertiary-50 p-2.5">
        <LucideIcon color="#b45309" icon={icon} size={16} />
      </View>
      <View className="flex-1">
        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
          {label}
        </Text>
        <Text className="mt-1 text-sm font-semibold leading-6 text-typography-950">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function CompanyProfileSection({
  companyProfile,
  companyCnpjInput,
  companyContactNameInput,
  companyContactPhoneInput,
  companyNameInput,
  feedbackMessage,
  feedbackTone,
  formErrorMessage,
  formErrors,
  isLoadingCompanyProfile,
  isSavingCompanyProfile,
  onCnpjChange,
  onContactNameChange,
  onContactPhoneChange,
  onNameChange,
  onRefresh,
  onSubmit,
}: {
  companyProfile: CompanyProfile | null;
  companyCnpjInput: string;
  companyContactNameInput: string;
  companyContactPhoneInput: string;
  companyNameInput: string;
  feedbackMessage: string | null;
  feedbackTone: "error" | "success" | null;
  formErrorMessage?: string;
  formErrors: {
    cnpj?: string;
    contactName?: string;
    contactPhone?: string;
    name?: string;
  };
  isLoadingCompanyProfile: boolean;
  isSavingCompanyProfile: boolean;
  onCnpjChange: (value: string) => void;
  onContactNameChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onRefresh: () => void;
  onSubmit: () => void;
}) {
  return (
    <View className="gap-4">
      {feedbackMessage && feedbackTone ? (
        <FeedbackBanner message={feedbackMessage} tone={feedbackTone} />
      ) : null}

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <SectionHeader
          eyebrow="Empresa"
          title="Dados da empresa"
          description="Atualize o cadastro principal da empresa sem sair do app."
        />

        <View className="mt-5 flex-row flex-wrap justify-between gap-y-4">
          <View className="w-[48.2%]">
            <SummaryCard
              label="Plano"
              value={companyProfile?.plan ?? "Carregando"}
              description="Plano ativo da empresa no Unipass."
            />
          </View>
          <View className="w-[48.2%]">
            <SummaryCard
              label="Usuarios"
              value={formatCount(companyProfile?._count?.users)}
              description="Usuarios vinculados a empresa."
            />
          </View>
          <View className="w-[48.2%]">
            <SummaryCard
              label="Alunos"
              value={formatCount(companyProfile?._count?.students)}
              description="Total de alunos cadastrados."
            />
          </View>
          <View className="w-[48.2%]">
            <SummaryCard
              label="Onibus"
              value={formatCount(companyProfile?._count?.buses)}
              description="Frota registrada nesta empresa."
            />
          </View>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-0 px-5 py-5">
        <View className="flex-row items-start justify-between gap-4">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-typography-950">
              Cadastro principal
            </Text>
            <Text className="mt-2 text-sm leading-6 text-typography-600">
              Nome, CNPJ e contato principal usados no relacionamento com a empresa.
            </Text>
          </View>

          <Button
            variant="outline"
            className="rounded-2xl"
            isDisabled={isLoadingCompanyProfile}
            onPress={onRefresh}
          >
            <LucideIcon color="#475569" icon={RefreshCcw} size={16} />
            <ButtonText>{isLoadingCompanyProfile ? "Atualizando..." : "Atualizar"}</ButtonText>
          </Button>
        </View>

        <View className="mt-5 gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-typography-700">
              Nome da empresa
            </Text>
            <Input>
              <InputField
                onChangeText={onNameChange}
                placeholder="Nome da empresa"
                value={companyNameInput}
              />
            </Input>
            {formErrors.name ? (
              <Text className="mt-2 text-sm text-red-600">{formErrors.name}</Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-typography-700">CNPJ</Text>
            <Input>
              <InputField
                keyboardType="number-pad"
                onChangeText={onCnpjChange}
                placeholder="00.000.000/0000-00"
                value={companyCnpjInput}
              />
            </Input>
            {formErrors.cnpj ? (
              <Text className="mt-2 text-sm text-red-600">{formErrors.cnpj}</Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-typography-700">
              Responsavel principal
            </Text>
            <Input>
              <InputField
                onChangeText={onContactNameChange}
                placeholder="Nome do contato"
                value={companyContactNameInput}
              />
            </Input>
            {formErrors.contactName ? (
              <Text className="mt-2 text-sm text-red-600">
                {formErrors.contactName}
              </Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-2 text-sm font-medium text-typography-700">
              Telefone do contato
            </Text>
            <Input>
              <InputField
                keyboardType="phone-pad"
                onChangeText={onContactPhoneChange}
                placeholder="(00) 00000-0000"
                value={companyContactPhoneInput}
              />
            </Input>
            {formErrors.contactPhone ? (
              <Text className="mt-2 text-sm text-red-600">
                {formErrors.contactPhone}
              </Text>
            ) : null}
          </View>

          {formErrorMessage ? (
            <Text className="text-sm font-medium text-red-600">{formErrorMessage}</Text>
          ) : null}

          <Button
            className="rounded-2xl bg-tertiary-500"
            isDisabled={isSavingCompanyProfile || isLoadingCompanyProfile}
            onPress={onSubmit}
          >
            <LucideIcon color="#FFFFFF" icon={Save} size={16} />
            <ButtonText className="text-typography-0">
              {isSavingCompanyProfile ? "Salvando..." : "Salvar dados da empresa"}
            </ButtonText>
          </Button>
        </View>
      </View>

      <View className="rounded-[28px] bg-background-50 px-5 py-5">
        <Text className="text-lg font-semibold text-typography-950">
          Informacoes da conta
        </Text>
        <View className="mt-4 gap-4">
          <InfoLine
            icon={Mail}
            label="Dominio corporativo"
            value={companyProfile?.emailDomain ?? "Nao informado"}
          />
          <InfoLine
            icon={Building2}
            label="Plano"
            value={companyProfile?.plan ?? "Nao informado"}
          />
          <InfoLine
            icon={ShieldCheck}
            label="SMS validado"
            value={
              companyProfile?.smsVerifiedAt
                ? `Validado em ${formatDate(companyProfile.smsVerifiedAt)}`
                : "Ainda nao validado"
            }
          />
          <InfoLine
            icon={CalendarDays}
            label="Criada em"
            value={formatDate(companyProfile?.createdAt)}
          />
          <InfoLine
            icon={ContactRound}
            label="Contato atual"
            value={companyProfile?.contactName?.trim() || "Nao informado"}
          />
          <InfoLine
            icon={Phone}
            label="Telefone atual"
            value={companyProfile?.contactPhone?.trim() || "Nao informado"}
          />
          <InfoLine
            icon={UsersRound}
            label="Devices"
            value={formatCount(companyProfile?._count?.devices)}
          />
          <InfoLine
            icon={Building2}
            label="ID da empresa"
            value={companyProfile?.id ?? "Nao informado"}
          />
        </View>
      </View>
    </View>
  );
}
