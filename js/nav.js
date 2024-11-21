"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

function navShowStoryForm(evt){
  evt.preventDefault();//prevent default behavior
  //get the form element
  const form = document.getElementById("new-story-form")
  //tottle the visibility
  form.style.display = form.style.display === "none" ? "block" : "none"
}

// Attach event listener to the "Submit New Story" link
document.getElementById("submit-link").addEventListener("click", navShowStoryForm);

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}
 // Handle the click event for the "Favorites" button in the nav bar
document.querySelector('#nav-favorites').addEventListener('click', showFavoritesList,);

function showFavoritesList() {
  console.debug("showFavoritesList");
  $allStoriesList.empty(); // Clear existing stories
  $storiesLoadingMsg.hide(); // Hide loading message if visible
  $favStoriesList.empty(); // clear 

  if (currentUser && currentUser.favorites.length > 0) {
    // Deduplicate the favorites array based on storyId (or another unique property)
    const uniqueFavorites = currentUser.favorites.filter((value, index, self) =>
      index === self.findIndex((story) => (
        story.storyId === value.storyId  // Assuming 'storyId' is the unique identifier
      ))
    );

    // Now, loop through the unique stories and render them
    for (let story of uniqueFavorites) {
      const $story = generateStoryMarkup(story); // Reuse your existing function to generate markup
      $favStoriesList.append($story);
    }
  } else {
    $favStoriesList.append('<h5>No favorites added yet!</h5>');
  }

  $allStoriesList.show(); // Display the list
}

