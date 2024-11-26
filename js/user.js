"use strict";

// global to hold the User instance of the currently-logged-in user
let currentUser;

/******************************************************************************
 * User login/signup/login
 */
//check for previous user in DOM
window.onload = async function() {
  // Wait for checkForRememberedUser to complete before updating UI
  await checkForRememberedUser();
};



/** Handle login form submission. If login ok, sets up the user instance */
// the below code alllows user ineraction but cant handle signup, rn i can use the other code to create the account and then this code to interact 

async function login(evt) {
  console.debug("login", evt);
  evt.preventDefault();

  // grab the username and password
  const username = $("#login-username").val();
  const password = $("#login-password").val();

  // User.login retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.login(username, password);

  $loginForm.trigger("reset");

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();
  location.reload();
}

$loginForm.on("submit", login);


/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  try {
    // Use the User.signup method to send the signup request
    currentUser = await User.signup(name, username, password);

    // Automatically log in after sign-up by calling the login function with the new credentials
    currentUser = await User.login(username, password);

    // Save user credentials and update UI
    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
    location.reload();  // Reload the page to reflect the logged-in state

    $signupForm.trigger("reset"); // Reset the form
    console.log("Signup and login successful for:", currentUser);
  } catch (error) {
    console.error("Signup failed:", error);
  }
}

$signupForm.on("submit", signup);

// In app.js or your main file

// Attach the submit event using jQuery
$signupForm.on("submit", async function (evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  try {
    // Signup API call
    currentUser = await User.signup(name, username, password);

    saveUserCredentialsInLocalStorage();
    updateUIOnUserLogin();
    login();
    


    $signupForm.trigger("reset"); // Reset the form
    console.log("Signup successful for:", currentUser);
  } catch (error) {
    console.error("Signup failed:", error);
  }
});


async function loadStories() {
  // Show the loading message when fetching stories
  $("#stories-loading-msg").show();
  
  // Fetch the stories
  const stories = await fetchStories();
  
  // Hide the loading message once stories are loaded
  $("#stories-loading-msg").hide();
  
  // Handle displaying stories on the page
  displayStories(stories);
}



/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  
  // Hide loading message before reload
  $("#stories-loading-msg").hide();
  
  $loginForm.show();
  $storiesLoadingMsg.hide();
  
  console.log("Logging out...");
  start(); // Or whatever the function is that starts the process after logout
  window.location.reload();
}

// $navLogOut.on("click", logout);
$(document).on("click", "#nav-logout", logout);

/******************************************************************************
 * Storing/recalling previously-logged-in-user with localStorage
 */

/** If there are user credentials in local storage, use those to log in
 * that user. This is meant to be called on page load, just once.
 */

async function checkForRememberedUser() {
  console.debug("checkForRememberedUser");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  if (!token || !username) return false;

  // Hide the loading message once the user is checked
  $("#stories-loading-msg").hide();

  // Attempt login with stored credentials
  currentUser = await User.loginViaStoredCredentials(token, username);
}



/** Sync current user information to localStorage.
 *
 * We store the username/token in localStorage so when the page is refreshed
 * (or the user revisits the site later), they will still be logged in.
 */

function saveUserCredentialsInLocalStorage() {
  console.debug("saveUserCredentialsInLocalStorage");
  if (currentUser) {
    localStorage.setItem("token", currentUser.loginToken);
    localStorage.setItem("username", currentUser.username);
  }
}

/******************************************************************************
 * General UI stuff about users
 */

/** When a user signs up or registers, we want to set up the UI for them:
 *
 * - show the stories list
 * - update nav bar options for logged-in user
 * - generate the user profile part of the page
 */

function updateUIOnUserLogin() {
  console.debug("updateUIOnUserLogin");

  // Only show the story list if it's not already visible
  if (!$allStoriesList.is(":visible")) {
    $allStoriesList.show();
  }

  // Hide login and signup forms only if they are visible
  if ($loginForm.is(":visible")) {
    $loginForm.hide();
  }
  if ($signupForm.is(":visible")) {
    $signupForm.hide();
  }

  updateNavOnLogin();
}



//handle favorites

function toggleFavoriteStory(evt) {
  if (!currentUser) {
    alert('You must be logged in to favorite stories.');
    return;
  }

  const storyId = $(evt.target).closest('li').attr('id');
  const isFavorited = currentUser.favorites.includes(storyId);

  if (isFavorited) {
    currentUser.unfavoriteStory(storyId)
      .then(() => {
        $(evt.target).removeClass('favorited').addClass('not-favorited');
      });
  } else {
    currentUser.favoriteStory(storyId)
      .then(() => {
        $(evt.target).removeClass('not-favorited').addClass('favorited');
      });
  }
 
}

$(document).on('click', '.favorite-btn', toggleFavoriteStory);



