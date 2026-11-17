import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Tab redirect para /trail/create
export default function AddTab() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/trail/create');
  }, []);
  return null;
}
