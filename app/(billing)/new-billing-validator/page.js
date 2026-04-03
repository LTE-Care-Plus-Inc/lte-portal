import StreamlitApp from '@/components/streamlit-wrapper';

export default function BillingValidatorPage() {
  return (
    <StreamlitApp 
      title="New Session Validator" 
      url="https://new-billing-checker.ltecareplus.org/" 
    />
  );
}