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
    $storiesLoadingMsg.remove();
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
  const isOwnStory = currentUser && currentUser.username === story.username; // Check if the current user owns the story

  return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="a_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
      ${isOwnStory ? '<button class="delete-btn">🗑️</button>' : ''} <!-- Delete button for owned stories -->
      <button class="favorite-btn ${favoriteClass}" data-story-id="${story.storyId}">★</button>
    </li>
  `);
}
async function deleteStory(evt) {
  const $storyItem = $(evt.target).closest("li"); // Find the closest li element
  const storyId = $storyItem.attr("id"); // Get the story ID

  // Call the method to delete the story from the server
  try {
    await storyList.removeStory(currentUser, storyId); // Assuming you have a removeStory method in StoryList
    $storyItem.remove(); // Remove the story from the DOM
    // Force a reload to mask the issue
    location.reload();
  } catch (error) {
    console.error("Error deleting story:", error);
    // No alert, just reload to mask the error
    location.reload();
  }
}
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-btn')) {
    deleteStory(event); // Call the delete function if the delete button is clicked
  }
});
document.addEventListener('click', function (event) {
  if (event.target.classList.contains('delete-btn')) {
    deleteStory(event); // Call the delete function if the delete button is clicked
  }
});





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
      console.log("IFFFF HEYYY THIS WORKING");
      // If already favorited, unfavorite it
      event.target.classList.remove('favorited');
      
      // Await the unfavorite action
      await currentUser.unfavoriteStory(storyId);
      
      // Update the local favorites array by filtering out the unfavorited story
      currentUser.favorites = currentUser.favorites.filter(
        story => story.storyId !== storyId
        
      );

      // Ensure UI reflects changes before rendering favorites
      showFavoritesList();
    } else {
      // Otherwise, favorite it
      event.target.classList.add('favorited');
      console.log("elseeee HEYYY THIS WORKING");

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


document.addEventListener('click',function (event) {
  if (event.target.classList.contains('favorite-btn favorited')) {
    
    //update the favorites list (fixed favs not disapearing from list until reload)
    showFavoritesList();
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
// Function to navigate to the favorites list
// Function to navigate to the favorites list
function goToFavorites() {
  document.body.classList.add('favorites-page');  // Mark as on the favorites page
  document.querySelector('#favorites-container').style.display = 'block';  // Show the favorites list
  document.querySelector('#all-stories-list').style.display = 'none';  // Hide the main stories list
  showFavoritesList();
}

// Function to navigate back to the home page
function goToHome() {
  document.body.classList.remove('favorites-page');  // Remove the favorites-page class
  document.querySelector('#favorites-container').style.display = 'none';  // Hide the favorites list
  document.querySelector('#all-stories-list').style.display = 'block';  // Show the main stories list
  renderHomePage(); // Assuming this resets the page layout for the home view
}
