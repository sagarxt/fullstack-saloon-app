import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BookingRouteRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/booking/${id}` as any} />;
}
