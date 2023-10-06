// Content script

function hasTimestamp(commentText) {
  var timestampPattern = /\d?\d:\d\d(:\d\d)?/g;
  var timestamps = commentText.match(timestampPattern);
  const parts = timestamps[0].split(":");
  if (parts.length < 2) {
    throw new Error("Invalid timestamp format");
  }
  if (parts.length == 2) {
    const seconds = parseInt(parts.pop()) || 0;
    const minutes = parseInt(parts.pop()) || 0;

    return minutes * 60 + seconds;
  } else if (parts.length == 3) {
    const seconds = parseInt(parts.pop()) || 0;
    const minutes = parseInt(parts.pop()) || 0;
    const hours = parseInt(parts.pop()) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }
}

function formatYouTubeCommentDate(timestamp) {
  const currentDate = new Date();
  const commentDate = new Date(timestamp);

  const timeDifference = currentDate - commentDate;
  const secondsDifference = timeDifference / 1000;
  const minutesDifference = secondsDifference / 60;
  const hoursDifference = minutesDifference / 60;
  const daysDifference = hoursDifference / 24;
  const weeksDifference = daysDifference / 7;
  const monthsDifference = daysDifference / 30.44; // Average number of days in a month
  const yearsDifference = daysDifference / 365.25; // Average number of days in a year (accounting for leap years)

  var stringTime = "";

  if (secondsDifference < 60) {
    stringTime = `${Math.floor(secondsDifference)} seconds ago`;
  } else if (minutesDifference < 60) {
    stringTime = `${Math.floor(minutesDifference)} minutes ago`;
  } else if (hoursDifference < 24) {
    stringTime = `${Math.floor(hoursDifference)} hours ago`;
  } else if (daysDifference < 7) {
    stringTime = `${Math.floor(daysDifference)} days ago`;
  } else if (weeksDifference < 4) {
    stringTime = `${Math.floor(weeksDifference)} weeks ago`;
  } else if (monthsDifference < 12) {
    stringTime = `${Math.floor(monthsDifference)} months ago`;
  } else {
    stringTime = `${Math.floor(yearsDifference)} years ago`;
  }

  if (stringTime.charAt(0) == "1") {
    stringTime =
      stringTime.slice(0, stringTime.length - 5) +
      stringTime.slice(stringTime.length - 4, stringTime.length);
  }
  return stringTime;
}

function orderList(comment_list) {
  const timeStampMap = new Map();
  for (const comment of comment_list) {
    const timeStamp_text = comment.topLevelComment.snippet.textOriginal;
    const timeStamp = hasTimestamp(timeStamp_text);
    comment.topLevelComment.snippet.timeStampValue = timeStamp;
    timeStampMap.set(timeStamp, comment);
  }
  timeStampMap.set(-1, comment_list[0].topLevelComment.snippet.videoId);
  return timeStampMap;
}

function createDiv() {
  const existingDiv = document.querySelector(".comment");
  if (!existingDiv) {
    const contentDiv = document.querySelector("#comments");
    if (contentDiv) {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.style.margin = "30px auto";
      commentDiv.style.backgroundColor = "#282828"; // Example background color
      commentDiv.style.padding = "10px"; // Add padding to match YouTube's style
      commentDiv.style.borderRadius = "10px"; // Add rounded corners

      const profileImageDiv = document.createElement("div");
      profileImageDiv.className = "profile-image";
      profileImageDiv.style.float = "left";
      profileImageDiv.style.width = "30px";
      profileImageDiv.style.height = "30px";
      profileImageDiv.style.margin = "6px 0px 0px 6px";

      const profileImage = document.createElement("img");
      profileImage.src = "";
      profileImage.style.width = "100%";
      profileImage.style.height = "100%";
      profileImageDiv.style.borderRadius = "300px";

      const profileImageLink = document.createElement("a");
      profileImageLink.href = "#"; // Replace with the actual link
      profileImageLink.appendChild(profileImage);

      // Append the profile image to the profile image div
      profileImageDiv.appendChild(profileImageLink);

      const usernameDiv = document.createElement("div");
      usernameDiv.className = "username";

      const usernameLink = document.createElement("a");
      usernameLink.href = "#"; // Replace with the actual link
      usernameLink.textContent = "Loading...";
      usernameLink.style.fontSize = "18px";
      usernameLink.style.color = "#FFFFFF";
      usernameLink.style.textDecoration = "none";

      usernameDiv.style.margin = "10px 0px 0px 10px";
      usernameDiv.style.paddingLeft = "32px";

      usernameDiv.appendChild(usernameLink);

      const userCommentDiv = document.createElement("div");
      userCommentDiv.className = "user-comment";
      userCommentDiv.style.margin = "0px";
      userCommentDiv.style.paddingTop = "5px";

      const dateSpan = document.createElement("div");
      dateSpan.className = "date-span";
      dateSpan.style.color = "#9E9E9E";
      dateSpan.style.fontSize = "13px";
      dateSpan.style.paddingTop = "35px";
      dateSpan.style.paddingLeft = "10px";
      dateSpan.textContent = "Loading...";

      const paragraph = document.createElement("p");
      paragraph.style.color = "#FFFFFF";
      paragraph.style.margin = "0px";
      paragraph.style.paddingTop = "5px";
      paragraph.style.paddingBottom = "5px";
      paragraph.style.fontSize = "16px";
      paragraph.style.paddingLeft = "10px";
      paragraph.style.paddingRight = "5px";
      paragraph.textContent = "Loading...";

      userCommentDiv.appendChild(paragraph);
      commentDiv.appendChild(profileImageDiv);
      commentDiv.appendChild(usernameDiv);
      commentDiv.appendChild(dateSpan);
      commentDiv.appendChild(userCommentDiv);

      contentDiv.insertBefore(commentDiv, contentDiv.firstChild);
    }
  }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.comments) {
    createDiv();
    const commentCount = message.comments.length;
    const videoId = message.videoId;
    ordered_comments = orderList(message.comments);
    updateText(ordered_comments, videoId);
  }
});

// Listen for changes in the YouTube player's time
function updateText(comment_list, videoId) {
  const player = document.getElementsByTagName("video")[0];
  if (player) {
    const listener = () => {
      if (videoId == comment_list.get(-1)) {
        var currTime = Math.floor(player.currentTime);
        displayTextForTimestamp(currTime, comment_list, videoId);
      }
    };
    player.addEventListener("timeupdate", listener);
  }
}

function displayTextForTimestamp(playerTime, timeStampMap, videoId) {
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var newVideoId = urlParams.get("v");
    if (newVideoId == timeStampMap.get(-1)) {
      const comment = timeStampMap.get(playerTime);
      if (comment) {
        console.log("Match");
        //console.log(comment);

        var channel = comment.topLevelComment.snippet.authorChannelUrl;

        const commentParagraph = document.querySelector(".user-comment p");
        commentParagraph.textContent =
          comment.topLevelComment.snippet.textOriginal;

        const dateSpan = document.querySelector(".date-span");
        dateSpan.textContent = formatYouTubeCommentDate(
          comment.topLevelComment.snippet.publishedAt
        );

        const userNameDiv = document.querySelector(".username a");
        userNameDiv.textContent =
          comment.topLevelComment.snippet.authorDisplayName;
        userNameDiv.setAttribute("href", channel);

        const profileImage = document.querySelector(".profile-image a img");
        profileImage.src =
          comment.topLevelComment.snippet.authorProfileImageUrl;

        const profileImageLink = document.querySelector(".profile-image a");
        profileImageLink.setAttribute("href", channel);
      }
    }
  } catch (error) {
    // Handle any errors that occur within the try block
    console.error("An error occurred:", error);
  }
}
