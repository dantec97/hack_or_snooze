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
}

$loginForm.on("submit", login);

/** Handle signup form submission. */

async function signup(evt) {
  console.debug("signup", evt);
  evt.preventDefault();

  const name = $("#signup-name").val();
  const username = $("#signup-username").val();
  const password = $("#signup-password").val();

  // User.signup retrieves user info from API and returns User instance
  // which we'll make the globally-available, logged-in user.
  currentUser = await User.signup(username, password, name);

  saveUserCredentialsInLocalStorage();
  updateUIOnUserLogin();

  $signupForm.trigger("reset");
}

$signupForm.on("submit", signup);

/** Handle click of logout button
 *
 * Remove their credentials from localStorage and refresh page
 */

function logout(evt) {
  console.debug("logout", evt);
  localStorage.clear();
  location.reload();
}

$navLogOut.on("click", logout);

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

  $allStoriesList.show();
  

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



// Event listener for the "Hack or Snooze" link
document.querySelector('#nav-all').addEventListener('click', function(event) {
  event.preventDefault();  // Prevent default link behavior (which would cause a page reload)
  
  // Hide the favorites list (bug fix for favs displaying after visiting favorites section)
  $favStoriesList.hide();
  
  // Optionally, you can also show the main story list or reset the page to the home state
  document.querySelector('#all-stories-list').style.display = 'block';  // Show the main stories list if needed
  
  // You can add additional logic here if you want to reset other parts of the UI
});
