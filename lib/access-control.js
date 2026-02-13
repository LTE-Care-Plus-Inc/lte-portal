// Email whitelist for restricted pages
export const RESTRICTED_ACCESS = {
  '/bt-payroll': [
    'henryc@ltecareplus.org',
    'christine@ltecareplus.org', 
    'jseet@ltecareplus.org'
  ],
  '/lba-payroll': [
    'henryc@ltecareplus.org',
    'christine@ltecareplus.org', 
    'jseet@ltecareplus.org'
  ]
};

export function hasAccess(userEmail, pathname) {
  // If the page isn't restricted, allow access
  if (!RESTRICTED_ACCESS[pathname]) {
    return true;
  }
  
  // Check if user's email is in the whitelist
  return RESTRICTED_ACCESS[pathname].includes(userEmail);
}