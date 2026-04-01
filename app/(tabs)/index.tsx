import { Button, ButtonText } from "@/components/ui/button";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-black text-xl mb-6">NativeWind funcionando 🎉</Text>

      <Button className="bg-orange-500 px-6 py-3 rounded-xl">
        <ButtonText className="text-white font-bold">
          Gluestack Button 🚀
        </ButtonText>
      </Button>
    </View>
  );
}
