export function getQueryParam(name, url = window.location.search) {
  return new URLSearchParams(url).get(name);
}