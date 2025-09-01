/**
 * Convert a date string into Locale Date String with seconds and milli seconds removed *
 * @function
 * @param {string} dateTimeStamp - Date in string format
 * @return {string} - Locale Date string
 */

export const formatDateTime = (dateTimeStamp) => {
  const dateObj = new Date(dateTimeStamp);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dateObj);
};

export const formatDate = (input) => {
  const d = new Date(input);
  if (isNaN(d)) throw new Error(`Invalid date: ${input}`);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Build the url with query params*
 * @function
 * @param {Object} queryObj - Query
 * @param {string} toPage - new page to be navigated
 * @return {string} - update the url with the query string
 */

export const appendQueryString = (queryObj, navigate, toPage) => {
  const validQueryObj = Object.fromEntries(
    Object.entries(queryObj).filter(
      // eslint-disable-next-line no-unused-vars
      ([_, value]) => value !== null && value !== undefined && value !== ""
    )
  );

  const queryString = new URLSearchParams(validQueryObj).toString();

  navigate({
    pathname: toPage ? toPage : window.location.pathname,
    search: `?${queryString}`,
  });
};
