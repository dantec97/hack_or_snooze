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

function handleFavoriteStory(evt) {
  const storyId = evt.target.dataset.storyId;

  // Check if the story is already in the favorites list
  const isFavorite = currentUser.favorites.some(story => story.id === storyId);

  if (isFavorite) {
    // If it's already favorited, do nothing (or you can unfavorite it here if needed)
    console.log('This story is already favorited');
  } else {
    // If it's not favorited, add it to the favorites list
    const storyToFavorite = getStoryById(storyId); // Replace with your logic to get the story by ID
    currentUser.favorites.push(storyToFavorite);

    // Save the updated favorites to localStorage
    saveFavoritesToLocalStorage(currentUser.favorites);

    // Update the UI to show the favorited state
    evt.target.classList.add('favorited');
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
  if (!(story instanceof Story)) {
    console.error("Invalid story instance:", story);
    return;
  }
  const hostName = story.getHostName();
  const isFavorited = currentUser && currentUser.favorites.some(fav => fav.storyId === story.storyId);
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
  const uniqueFavorites = Array.from(new Set(favorites.map(fav => fav.storyId)))
    .map(id => favorites.find(fav => fav.storyId === id));
  localStorage.setItem('favorites', JSON.stringify(uniqueFavorites));
}


document.addEventListener('click', async function (event) {
  if (event.target.classList.contains('favorite-btn')) {
    const storyId = event.target.dataset.storyId;

    if (event.target.classList.contains('favorited')) {
      // If already favorited, unfavorite it
      event.target.classList.remove('favorited');
      await currentUser.unfavoriteStory(storyId);

      // Update the local favorites array by filtering out the unfavorited story
      currentUser.favorites = currentUser.favorites.filter(
        story => story.storyId !== storyId
      );
    } else {
      // Otherwise, favorite it
      event.target.classList.add('favorited');
      console.log("HEYYY THIS WORKING");

      const storyToAdd = storyList.stories.find(story => story.storyId === storyId);
      if (storyToAdd) {
        await currentUser.favoriteStory(storyId);

        // Add to local favorites if not already present
        if (!currentUser.favorites.some(fav => fav.storyId === storyId)) {
          currentUser.favorites.push(storyToAdd);
        }
      }
    }

    // Update the UI
    renderFavorites();

    // Ensure favorites data is passed to localStorage in the correct format
    saveFavoritesToLocalStorage(currentUser.favorites);
  }
});



function renderFavorites() {
  console.log("Favorites:", currentUser.favorites); // Log the current favorites
  const $favStoriesList = $('#favorites-container');
  $favStoriesList.html(''); // Clear the container before rendering

  currentUser.favorites.forEach(favorite => {
    const $storyElement = $(`
      <li id="${favorite.storyId}">
        <a href="${favorite.url}" target="_blank">${favorite.title}</a>
        <small>by ${favorite.author}</small>
        <button class="favorite-btn favorited" data-story-id="${favorite.storyId}">⭐</button>
      </li>
    `);
    $favStoriesList.append($storyElement);
  });
}

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
  $favStoriesList.append($story);  // Adds the story back to the favorites list
  
}



document.addEventListener('DOMContentLoaded', updateFavoritesOnPageLoad);
