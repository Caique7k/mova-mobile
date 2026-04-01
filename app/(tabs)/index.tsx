import { Button, ButtonText } from "@/components/ui/button";
import { API_BASE_URL } from "@/constants/api";
import { ApiError } from "@/services/api";
import { checkHealth } from "@/services/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function Home() {
  const [healthMessage, setHealthMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    setHealthMessage(null);

    try {
      const result = await checkHealth();
      setHealthMessage(result?.message ?? "Conexão estabelecida com o backend");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(`Erro ${e.status}: ${e.message}`);
      } else if (e instanceof Error) {
        setError(`Erro de rede: ${e.message}`);
      } else {
        setError("Falha ao conectar com o backend. Verifique a URL/API.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-black text-xl mb-4">Unipass Mobile</Text>
      <Text className="text-zinc-500 text-sm mb-8 text-center"></Text>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" />
      ) : (
        <>
          {healthMessage ? (
            <Text className="text-green-600 mb-4">{healthMessage}</Text>
          ) : null}
          {error ? <Text className="text-red-600 mb-4">{error}</Text> : null}

          <Text className="text-zinc-500 text-xs mb-4 text-center">
            API_BASE_URL: {API_BASE_URL}
          </Text>

          <Button
            className="bg-orange-500 px-6 py-3 rounded-xl"
            onPress={fetchHealth}
          >
            <ButtonText className="text-white font-bold">
              Verificar backend
            </ButtonText>
          </Button>
        </>
      )}
    </View>
  );
}
