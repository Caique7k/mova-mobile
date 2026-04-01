import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { LucideIcon } from "@/components/ui/lucide-icon";
import { API_BASE_URL } from "@/constants/api";
import { useAuth } from "@/contexts/auth-context";
import { checkHealth } from "@/services/auth";
import { ApiError } from "@/services/api";
import { Image } from "expo-image";
import { Eye, EyeOff, ShieldCheck } from "lucide";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logoUnipass = require("../assets/images/logo_unipass.png");

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (
      error.response &&
      typeof error.response === "object" &&
      "message" in error.response &&
      typeof error.response.message === "string"
    ) {
      return error.response.message;
    }

    if (error.status === 401) {
      return "Email ou senha invalidos.";
    }

    return `Erro ${error.status}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel concluir o login.";
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isSigningIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<{
    message: string;
    tone: "loading" | "success" | "error";
  }>({
    tone: "loading",
    message: "Verificando conexao com o backend...",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadBackendStatus() {
      try {
        const response = await checkHealth();

        if (!isMounted) {
          return;
        }

        setBackendStatus({
          tone: "success",
          message: response.message || "Backend conectado",
        });
      } catch (backendError) {
        if (!isMounted) {
          return;
        }

        setBackendStatus({
          tone: "error",
          message: getErrorMessage(backendError),
        });
      }
    }

    void loadBackendStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password.trim()) {
      setError("Preencha email e senha para continuar.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Digite um email valido.");
      return;
    }

    setError(null);

    try {
      await signIn({
        email: normalizedEmail,
        password,
      });

      router.replace("/");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    }
  }

  const backendPillClassName =
    backendStatus.tone === "success"
      ? "bg-success-50"
      : backendStatus.tone === "error"
        ? "bg-error-50"
        : "bg-info-50";

  const backendTextClassName =
    backendStatus.tone === "success"
      ? "text-success-700"
      : backendStatus.tone === "error"
        ? "text-error-700"
        : "text-info-700";

  return (
    <SafeAreaView className="flex-1 bg-background-0">
      <View className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-tertiary-100" />
      <View className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-info-50" />
      <View className="absolute bottom-0 left-12 h-36 w-36 rounded-full bg-tertiary-50" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 justify-between px-6 pb-8 pt-6">
            <View className="gap-8">
              <View className="gap-5">
                <Image
                  source={logoUnipass}
                  contentFit="contain"
                  style={{ width: 186, height: 56 }}
                />

                <View className="self-start rounded-full bg-tertiary-50 px-4 py-2">
                  <View className="flex-row items-center gap-2">
                    <LucideIcon icon={ShieldCheck} size={16} color="#b45309" />
                    <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-tertiary-700">
                      Acesso seguro
                    </Text>
                  </View>
                </View>

                <View className="gap-3">
                  <Text className="text-4xl font-bold leading-tight text-typography-950">
                    Entre para continuar sua jornada.
                  </Text>
                  <Text className="text-base leading-7 text-typography-600">
                    Seu backend atual autentica por cookie httpOnly. Depois do login,
                    o app busca a sessao em /auth/me para liberar a proxima tela.
                  </Text>
                </View>

                <View
                  className={`self-start rounded-full px-4 py-2 ${backendPillClassName}`}
                >
                  <Text
                    className={`text-xs font-semibold ${backendTextClassName}`}
                  >
                    {backendStatus.message}
                  </Text>
                </View>
              </View>

              <View className="rounded-[28px] border border-outline-100 bg-background-0 p-6">
                <View className="gap-5">
                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-typography-800">
                      Email
                    </Text>
                    <Input>
                      <InputField
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);

                          if (error) {
                            setError(null);
                          }
                        }}
                        placeholder="voce@empresa.com"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        returnKeyType="next"
                        textContentType="emailAddress"
                      />
                    </Input>
                  </View>

                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-typography-800">
                      Senha
                    </Text>
                    <Input isInvalid={Boolean(error)}>
                      <InputField
                        value={password}
                        onChangeText={(value) => {
                          setPassword(value);

                          if (error) {
                            setError(null);
                          }
                        }}
                        placeholder="Digite sua senha"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        textContentType="password"
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                      />
                      <InputSlot
                        focusOnPress={false}
                        onPress={() => setShowPassword((current) => !current)}
                      >
                        <LucideIcon
                          icon={showPassword ? EyeOff : Eye}
                          size={18}
                          color="#737373"
                        />
                      </InputSlot>
                    </Input>
                  </View>

                  {error ? (
                    <View className="rounded-2xl bg-background-error px-4 py-3">
                      <Text className="text-sm leading-6 text-error-700">
                        {error}
                      </Text>
                    </View>
                  ) : null}

                  <Button
                    size="lg"
                    className="mt-2 rounded-2xl bg-tertiary-500"
                    onPress={handleLogin}
                    isDisabled={isSigningIn}
                  >
                    {isSigningIn ? <ButtonSpinner color="#FFFFFF" /> : null}
                    <ButtonText className="text-typography-0">
                      {isSigningIn ? "Entrando..." : "Entrar"}
                    </ButtonText>
                  </Button>

                  <View className="rounded-2xl bg-background-50 px-4 py-3">
                    <Text className="text-xs leading-5 text-typography-500">
                      Endpoint atual: {API_BASE_URL}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text className="mt-10 text-center text-sm leading-6 text-typography-500">
              Se o login aceitar mas /auth/me falhar, o ajuste normalmente esta em
              cookie, CORS com credentials e configuracao de dominio/sameSite.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}