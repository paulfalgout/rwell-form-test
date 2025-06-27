export function parseErrorMessage(errorString) {
  // Split by '); ' to separate individual error messages
  const errorPairs = errorString.split('); ');

  return errorPairs.map((pair, index) => {
    // Add back the closing parenthesis except for the last item
    const fullPair = index === errorPairs.length - 1 ? pair : pair + ')';

    // Find the last occurrence of ' (' to split message from key
    const lastParenIndex = fullPair.lastIndexOf(' (');

    if (lastParenIndex === -1) {
      // If no parentheses found, treat entire string as message
      return {
        message: fullPair.trim(),
        key: null
      };
    }

    const message = fullPair.substring(0, lastParenIndex).trim();
    const key = fullPair.substring(lastParenIndex + 2, fullPair.length - 1).trim();

    // Get child id from key
    const childRef = key.split('.')[0];

    return {
      message,
      key,
      childRef
    };
  }).filter(item => item.message); // Filter out any empty messages
}

// Example usage:
// const errorString = "Phone number is invalid. (patientInformation.phones[0].key); Phone number is invalid. (patientInformation.phones[1].key)";
// const parsedErrors = parseErrorMessage(errorString);

// console.log(parsedErrors);
// Output:
// [
//   { message: "Phone number is invalid.", key: "patientInformation.phones[0].key" },
//   { message: "Phone number is invalid.", key: "patientInformation.phones[1].key" }
// ]