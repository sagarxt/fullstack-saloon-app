import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProductRouteRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/product/${id}` as any} />;
}
