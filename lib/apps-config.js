export const DEPARTMENTS = [
  {
    name: "Payroll Department",
    id: "payroll",
    apps: [
      { name: "BT Payroll", path: "/bt-payroll", desc: "Main payroll processor" },
      { name: "LBA Payroll", path: "/lba-payroll", desc: "LBA hours tracking" }
    ]
  },
  {
    name: "Clinical Operations",
    id: "clinical",
    apps: [
      { name: "Session Checker", path: "/session-checker", desc: "Audit clinical sessions" },
      { name: "Behavior Analytics", path: "https://vps:8501", desc: "Streamlit Insights" }
    ]
  }
];