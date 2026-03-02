import StreamlitApp from '@/components/streamlit-wrapper';

export default function TimesheetPage() {
  return (
    <StreamlitApp 
      title="Timesheet Checker" 
      url= "https://timesheet-checker.ltecareplus.org/"
    />
  );
}