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


//this code allows to create an account but freeze after, i have to use the above code to interact
// async function login(evt) {
//   console.debug("login", evt);
//   evt.preventDefault();

//   // grab the username and password
//   const username = $("#login-username").val();
//   const password = $("#login-password").val();

//   // User.login retrieves user info from API and returns User instance
//   // which we'll make the globally-available, logged-in user.
//   currentUser = await User.login(username, password);

//   $loginForm.trigger("reset");

//   saveUserCredentialsInLocalStorage();
//   updateUIOnUserLogin();
// }

// $loginForm.on("submit", login);

// /** Handle signup form submission. */

// async function signup(evt) {
//   console.debug("signup", evt);
//   evt.preventDefault();

//   const name = $("#signup-name").val();
//   const username = $("#signup-username").val();
//   const password = $("#signup-password").val();

//   // User.signup retrieves user info from API and returns User instance
//   // which we'll make the globally-available, logged-in user.
//   currentUser = await User.signup(username, password, name);

//   saveUserCredentialsInLocalStorage();
//   updateUIOnUserLogin();

//   $signupForm.trigger("reset");
// }

// $signupForm.on("submit", signup);




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
  
  
  // Ensure that the loading message is hidden
  $("#stories-loading-msg").hide(); 

  $loginForm.show();
  $storiesLoadingMsg.hide();
  console.log("hihihihihi")
  start();
  window.location.reload();

  ///hiiii dante, so we know the reload causes rthe loading screen to persist, when i removed window.reload() it kinda fixed it 

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

  // Show the story list once the user is logged in
  $allStoriesList.show();

  // Hide the login and signup forms
  $loginForm.hide();
  $signupForm.hide();

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
