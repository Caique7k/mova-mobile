import { PlatformHeader } from "@/components/platform-header";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { useAuth } from "@/contexts/auth-context";
import {
  extractSessionRoles,
  getPrimarySessionRole,
  shouldShowRoleHub,
} from "@/services/auth";
import { useRouter } from "expo-router";
import { Building2, Compass, CreditCard, LogOut, MapPinned, User } from "lucide";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function InfoCard({
  description,
  icon,
  title,
}: {
  description: string;
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  title: string;
}) {
  return (
    <View className="rounded-[28px] border border-outline-200 bg-background-0 px-5 py-5">
      <View className="flex-row items-start gap-4">
        <View className="rounded-2xl bg-tertiary-50 p-3">
          <LucideIcon color="#b45309" icon={icon} size={20} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-typography-950">
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-typography-600">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { company, session, signOut, user } = useAuth();
  const primaryRole = getPrimarySessionRole(session);
  const roles = extractSessionRoles(session);
  const isRoleHub = shouldShowRoleHub(session);

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const title =
    primaryRole === "PLATFORM_ADMIN" ? "Empresas da plataforma" : "Area do aluno";
  const subtitle =
    primaryRole === "PLATFORM_ADMIN"
      ? "O mobile reconhece o perfil da plataforma, mas a gestao multiempresa continua priorizada no painel web."
      : "As funcoes do app do aluno entram nos proximos passos. Por enquanto, esta area centraliza o contexto da sua conta.";

  if (!isRoleHub) {
    return (
      <SafeAreaView className="flex-1 bg-background-50">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View className="gap-5">
            <PlatformHeader
              title="Area complementar"
              subtitle="Esta rota fica reservada para PLATFORM_ADMIN e USER no mobile, seguindo a regra definida para a navegacao por perfil."
              detail={user?.email ?? "Sessao autenticada"}
              onSignOut={handleLogout}
            />

            <View className="rounded-[28px] bg-red-50 px-5 py-5">
              <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-red-700">
                Acesso restrito
              </Text>
              <Text className="mt-2 text-2xl font-bold text-red-900">
                Esta area nao pertence ao seu perfil.
              </Text>
              <Text className="mt-2 text-sm leading-6 text-red-700">
                ADMIN, DRIVER e COORDINATOR usam as areas operacionais do app.
                Se esta tela foi aberta manualmente, o mobile manteve a regra do
                web e bloqueou o conteudo.
              </Text>
              {roles.length > 0 && (
                <Text className="mt-3 text-xs font-semibold uppercase tracking-[1.5px] text-red-600">
                  Perfis encontrados: {roles.join(", ")}
                </Text>
              )}
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
            title={title}
            subtitle={subtitle}
            detail={user?.email ?? "Sessao autenticada"}
            onSignOut={handleLogout}
          />

          <View className="rounded-[28px] bg-background-0 px-5 py-5">
            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-typography-500">
              Perfil reconhecido
            </Text>
            <Text className="mt-2 text-[28px] font-bold leading-9 text-typography-950">
              {primaryRole ?? "Perfil nao identificado"}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-typography-600">
              {roles.length > 0
                ? `Perfis encontrados na sessao: ${roles.join(", ")}.`
                : "Nenhum perfil explicito veio na sessao; o app segue em modo de compatibilidade."}
            </Text>
          </View>

          {primaryRole === "PLATFORM_ADMIN" ? (
            <>
              <InfoCard
                description="No web, este perfil entra pela area de Empresas. No mobile, essa gestao ainda nao ganhou telas dedicadas."
                icon={Building2}
                title="Gestao multiempresa"
              />
              <InfoCard
                description="Enquanto isso, use o painel web para cadastro, operacao e configuracoes mais amplas da plataforma."
                icon={Compass}
                title="Melhor experiencia no web"
              />
            </>
          ) : (
            <>
              <InfoCard
                description="Rastreamento do transporte, presenca e notificacoes entram nos proximos passos do app do aluno."
                icon={MapPinned}
                title="Rastreamento"
              />
              <InfoCard
                description="Fluxos como boleto, carteira digital e acompanhamento pessoal ficam concentrados aqui quando as proximas etapas forem liberadas."
                icon={CreditCard}
                title="Servicos do aluno"
              />
            </>
          )}

          <View className="rounded-[28px] bg-background-0 px-5 py-5">
            <View className="flex-row items-center gap-3">
              <LucideIcon color="#475569" icon={User} size={18} />
              <Text className="text-sm leading-6 text-typography-700">
                Usuario: {user?.name ?? user?.email ?? "Nao identificado"}
              </Text>
            </View>
            <View className="mt-3 flex-row items-center gap-3">
              <LucideIcon color="#475569" icon={Building2} size={18} />
              <Text className="text-sm leading-6 text-typography-700">
                Empresa: {company?.name ?? "Nao vinculada"}
              </Text>
            </View>
            <View className="mt-3 flex-row items-center gap-3">
              <LucideIcon color="#dc2626" icon={LogOut} size={18} />
              <Text className="text-sm leading-6 text-typography-700">
                O botao de sair continua disponivel no topo desta tela.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
