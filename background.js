function hasTimestamp(commentText) {
  var timestampPattern = /\d?\d:\d\d(:\d\d)?/g;
  var timestamps = commentText.match(timestampPattern);
  return timestamps !== null; // Simplify the return statement
}

// Initialize an array to store all comments
var commentsArray = [];

// Store the video ID of the currently loaded video
var currentVideoId = null;

// Function to fetch comments using pagination
async function fetchComments(apiUrl, pageToken) {
  // Append the pageToken to the API URL if it exists
  if (pageToken) {
    apiUrl += `&pageToken=${pageToken}`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      for (var i = 0; i < data.items.length; i++) {
        var commentText =
          data.items[i].snippet.topLevelComment.snippet.textOriginal;
        if (hasTimestamp(commentText)) {
          commentsArray.push(data.items[i].snippet);
        }
      }

      // Check if there are more comments to fetch
      if (data.nextPageToken) {
        // If there's a nextPageToken, recursively fetch the next page of comments
        console.log("Length of comments array: " + commentsArray.length);

        return fetchComments(apiUrl, data.nextPageToken);
      } else {
        // No more comments to fetch, return the commentsArray
        console.log("end");

        return commentsArray;
      }
    } else {
      // No comments found, return an empty array
      return commentsArray;
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return commentsArray;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  // This runs ONE TIME ONLY (unless the user reinstalls your extension)
  // You can add any initialization logic here if needed.
});

chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  // Check if the loaded page is a YouTube video
  if (details.url.includes("youtube.com/watch?v=")) {
    // Extract the video ID from the URL
    const videoId = new URL(details.url).searchParams.get("v");

    // Check if the video ID has changed (new video)
    if (videoId !== currentVideoId) {
      // If it's a new video, reset the commentsArray
      commentsArray = [];
      currentVideoId = videoId;
    }

    // Construct the API URL and fetch comments
    const apiKey = "AIzaSyBkYh1V-Rw0pvmoCV4WujrvcPMpoo_UduQ"; // Replace with your API key
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&maxResults=200&part=snippet&videoId=${videoId}`;

    try {
      const result = await fetchComments(apiUrl, null);
      console.log(result);
      // Send the result to the content script
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log(tabs);
        chrome.tabs.sendMessage(tabs[0].id, {
          comments: result,
          videoId: currentVideoId,
        });
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }
});
