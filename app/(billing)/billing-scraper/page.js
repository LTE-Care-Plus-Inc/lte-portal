import StreamlitApp from '@/components/streamlit-wrapper';

export default function BillingScraperPage() {
  return (
    <StreamlitApp 
      title="ERA Scraper" 
      url="https://billing-scraper.ltecareplus.org/" 
    />
  );
}