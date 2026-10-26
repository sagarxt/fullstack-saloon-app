import React from 'react';
import { Redirect } from 'expo-router';

export default function PolicyRouteRedirect() {
  return <Redirect href={'/(tabs)/policy' as any} />;
}
