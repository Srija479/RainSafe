import { Stack } from 'expo-router';
import { HazardProvider } from './HazardContext';

export default function RootLayout() {
  return (
    <HazardProvider>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </HazardProvider>
  );
}