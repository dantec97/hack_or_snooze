"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  await checkForRememberedUser();  // Wait for the user to be logged in
  if (currentUser) {
    // Now that currentUser is available, we can load the stories
    storyList = await StoryList.getStories();
    $storiesLoadingMsg.remove();
    putStoriesOnPage();
  } else {
    // Handle the case where currentUser is not available
    console.log("No user logged in");
  }
}


/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */
async function handleStorySubmission(evt) {
  
  // Get form data
  const title = document.querySelector('#title').value;
  const author = document.querySelector('#author').value;
  const url = document.querySelector('#url').value;

  // Call addStory method
  const newStory = await storyList.addStory(currentUser, { title, author, url });

  // Generate the story markup (ensure this is returning HTML)
  const storyMarkup = generateStoryMarkup(newStory);

  // Find the story list element and prepend the new story
  const storyListElement = document.querySelector('#all-stories-list');
  storyListElement.prepend(storyMarkup);

  // Reset the form
  evt.target.reset();
}



function generateStoryMarkup(story) {
  const hostName = story.getHostName();
  const isFavorited = currentUser && currentUser.favorites && currentUser.favorites.includes(story.storyId);
  const favoriteClass = isFavorited ? 'favorited' : 'not-favorited';

  return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
      <button class="favorite-btn ${favoriteClass}" data-story-id="${story.storyId}">★</button>
    </li>
  `);
}





document.querySelector('#new-story-form').addEventListener('submit', handleStorySubmission);

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}
function saveFavoritesToLocalStorage(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

document.addEventListener('click', async function (event) {
  if (event.target.classList.contains('favorite-btn')) {
    const storyId = event.target.dataset.storyId; // Get the storyId from data attribute

    if (event.target.classList.contains('favorited')) {
      // If it's already favorited, unfavorite it
      event.target.classList.remove('favorited');

      // Remove the story from the favorites
      currentUser.favorites = currentUser.favorites.filter(
        story => story.storyId !== storyId
      );

    } else {
      // Otherwise, favorite it
      event.target.classList.add('favorited');

      // Fetch the story object to add it properly
      const storyToAdd = storyList.stories.find(story => story.storyId === storyId);
      if (storyToAdd) {
        currentUser.favorites.push(storyToAdd);
      }
    }

    // Update localStorage and the UI
    saveFavoritesToLocalStorage(currentUser.favorites);
    showFavoritesList(); // Re-render the favorites list to update the DOM
  }
});
//the abouve code is doubling the favs 

function findStoryById(storyId) {
  return allStories.find(story => story.storyId === storyId);  // Assuming `allStories` is an array of all stories
}




function updateFavoritesOnPageLoad() {
  // Get the list of favorited story IDs from localStorage
  const favoritedStoryIds = JSON.parse(localStorage.getItem('favorites')) || [];

  // Loop through each story and check if it's favorited
  favoritedStoryIds.forEach(storyId => {
    const button = document.querySelector(`.favorite-btn[data-story-id="${storyId}"]`);
    if (button) {
      button.classList.add('favorited'); // Apply the favorited class to the button
    }
  });
}

// Helper function to remove unfavorited story from the DOM
function removeStoryFromFavoritesPage(storyId) {
  const storyElement = document.querySelector(`#favorites-list li[data-story-id='${storyId}']`);
  if (storyElement) {
    storyElement.remove(); // Removes the story element from the favorites list
  }
}

// Helper function to add a new favorite story to the DOM
function addStoryToFavoritesPage(storyId) {
  const story = storyList.stories.find(story => story.storyId === storyId);
  const $story = generateStoryMarkup(story);
  const favoritesList = document.querySelector("#fav-stories-list");
  favoritesList.append($story);  // Adds the story back to the favorites list
  
}



document.addEventListener('DOMContentLoaded', updateFavoritesOnPageLoad);
