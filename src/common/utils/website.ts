type WebsiteInfo = {
  logo: string;
  name: string;
  url: string;
  domain: string; // Includes domain
};

export const domainToUrl = (domain: string, scheme = 'https'): string => {
  // Ensure the domain does not start with 'http://' or 'https://'
  const normalizedDomain = domain.replace(/^https?:\/\//, '');

  return `${scheme}://${normalizedDomain}`;
};

export const getDomain = (url: string): string => {
  const urlObject = new URL(url);
  return urlObject.hostname.replace('www.', ''); // Normalize by removing 'www.'
};

export const detectNameFromDomain = (domain: string): string => {
  // Remove protocol (http, https) if present
  const cleanDomain = domain.replace(/https?:\/\//, '');

  // Remove the top-level domain (TLD)
  const baseName = cleanDomain.split('.').slice(0, -1).join('.');

  // Capitalize the first letter of the base name
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
};

export const getWebsiteInfo = (url: string): WebsiteInfo => {
  // Get the domain from the URL
  const _url = domainToUrl(url);
  const _domain = getDomain(_url);
  const _name = detectNameFromDomain(_domain);
  const _logo = (() => {
    switch (_domain) {
      case 'google.com':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/48px-Google_%22G%22_logo.svg.png';
      case 'facebook.com':
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/1200px-2023_Facebook_icon.svg.png';
      case 'behance.com':
        return 'https://cdn.freebiesupply.com/logos/large/2x/behance-1-logo-png-transparent.png';
      case 'pinterest.com':
        return 'https://www.freepnglogos.com/uploads/pinterest-logo-p-png-0.png';
      case 'github.com':
        return 'https://www.freepnglogos.com/uploads/512x512-logo-png/512x512-logo-github-icon-35.png';
      default:
        return 'https://www.freepnglogos.com/uploads/logo-website-png/logo-website-world-wide-web-globe-icons-download-1.png';
    }
  })();

  // Create the result
  const result: WebsiteInfo = {
    logo: _logo,
    name: _name,
    url: _url,
    domain: _domain, // Include domain in the result
  };

  return result;
};
