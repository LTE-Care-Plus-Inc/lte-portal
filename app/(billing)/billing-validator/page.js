import StreamlitApp from '@/components/streamlit-wrapper';

export default function BillingValidatorPage() {
  return (
    <StreamlitApp 
      title="Session Validator" 
      url="https://session-checker.ltecareplus.org/" 
    />
  );
}