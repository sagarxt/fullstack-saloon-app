import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ServiceRouteRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/service/${id}` as any} />;
}
