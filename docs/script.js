/* ===== BlogSpace Home page: published articles ===== */

const homeBlogList = document.getElementById("blogList");

if (homeBlogList) {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const homeMessage = document.getElementById("homeMessage");
  const articleDialog = document.getElementById("articleDialog");
  const articlePreviewContent = document.getElementById(
    "articlePreviewContent"
  );
  const closeArticleButton = document.getElementById("closeArticle");

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function readPublishedPosts() {
    try {
      const posts = JSON.parse(
        localStorage.getItem("blogspace_posts") || "[]"
      );

      if (!Array.isArray(posts)) return [];

      return posts
        .filter(post =>
          post &&
          post.status === "published" &&
          typeof post.title === "string" &&
          typeof post.content === "string"
        )
        .sort((a, b) =>
          String(b.updatedAt || b.createdAt || "").localeCompare(
            String(a.updatedAt || a.createdAt || "")
          )
        );
    } catch (error) {
      console.error("Unable to load published blogs:", error);
      return null;
    }
  }

  function getSafeCoverUrl(value) {
    if (!value) return "";

    try {
      const url = new URL(value);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.href;
      }
    } catch {
      // Ignore invalid optional cover URLs.
    }

    return "";
  }

  function getExcerpt(content, maxLength = 150) {
    const text = String(content || "").trim();

    if (text.length <= maxLength) return text;

    return text.slice(0, maxLength).trimEnd() + "...";
  }

  function getAuthorName(post) {
    try {
      const users = JSON.parse(
        localStorage.getItem("blogspace_users") || "[]"
      );

      const author = Array.isArray(users)
        ? users.find(user => user.id === post.userId)
        : null;

      return author?.fullName || "BlogSpace Writer";
    } catch {
      return "BlogSpace Writer";
    }
  }

  function renderPublishedPosts() {
    const posts = readPublishedPosts();

    if (posts === null) {
      homeBlogList.replaceChildren();

      const error = document.createElement("p");
      error.textContent = "Unable to load stories. Please refresh and try again.";
      homeBlogList.append(error);
      return;
    }

    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const filteredPosts = posts.filter(post => {
      const matchesQuery = [
        post.title,
        post.category,
        post.content
      ].some(value =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesCategory =
        category === "all" || post.category === category;

      return matchesQuery && matchesCategory;
    });

    homeBlogList.replaceChildren();

    if (filteredPosts.length === 0) {
      const empty = document.createElement("div");
      empty.className = "home-empty-state";

      const title = document.createElement("h3");
      title.textContent = posts.length === 0
        ? "Your next great story starts here."
        : "No stories found.";

      const description = document.createElement("p");
      description.textContent = posts.length === 0
        ? "Published community stories will appear here. Sign in and publish your first blog!"
        : "Try another search or choose a different category.";

      empty.append(title, description);
      homeBlogList.append(empty);
      return;
    }

    filteredPosts.forEach(post => {
      const card = document.createElement("article");
      card.className = "blog-card home-blog-card";

      const coverUrl = getSafeCoverUrl(post.cover);

      if (coverUrl) {
        const image = document.createElement("img");
        image.className = "blog-cover";
        image.src = coverUrl;
        image.alt = `Cover for ${post.title}`;
        image.loading = "lazy";

        image.addEventListener("error", () => {
          image.remove();
        });

        card.append(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "blog-cover-placeholder";
        placeholder.setAttribute("aria-hidden", "true");
        placeholder.textContent = "BlogSpace";
        card.append(placeholder);
      }

      const body = document.createElement("div");
      body.className = "blog-card-body";

      const categoryBadge = document.createElement("span");
      categoryBadge.className = "blog-category";
      categoryBadge.textContent = post.category || "Other";

      const heading = document.createElement("h3");
      heading.textContent = post.title;

      const excerpt = document.createElement("p");
      excerpt.className = "blog-excerpt";
      excerpt.textContent = getExcerpt(post.content);

      const meta = document.createElement("div");
      meta.className = "blog-meta";
      meta.textContent = `By ${getAuthorName(post)}`;

      const readButton = document.createElement("button");
      readButton.type = "button";
      readButton.className = "read-article-button";
      readButton.textContent = "Read article →";

      readButton.addEventListener("click", () => {
        openArticle(post);
      });

      body.append(categoryBadge, heading, excerpt, meta, readButton);
      card.append(body);
      homeBlogList.append(card);
    });
  }

  function openArticle(post) {
    articlePreviewContent.replaceChildren();

    const coverUrl = getSafeCoverUrl(post.cover);

    if (coverUrl) {
      const image = document.createElement("img");
      image.className = "article-cover";
      image.src = coverUrl;
      image.alt = `Cover for ${post.title}`;
      image.addEventListener("error", () => image.remove());
      articlePreviewContent.append(image);
    }

    const category = document.createElement("p");
    category.className = "eyebrow";
    category.textContent = post.category || "Other";

    const title = document.createElement("h2");
    title.className = "article-title";
    title.textContent = post.title;

    const author = document.createElement("p");
    author.className = "article-author";
    author.textContent = `Written by ${getAuthorName(post)}`;

    const content = document.createElement("div");
    content.className = "article-body";

    // Display as plain text, never execute article content as HTML.
    content.textContent = post.content;

    articlePreviewContent.append(category, title, author, content);

    if (typeof articleDialog.showModal === "function") {
      articleDialog.showModal();
    }
  }

  searchInput.addEventListener("input", renderPublishedPosts);
  categoryFilter.addEventListener("change", renderPublishedPosts);

  closeArticleButton.addEventListener("click", () => {
    articleDialog.close();
  });

  articleDialog.addEventListener("click", event => {
    if (event.target === articleDialog) {
      articleDialog.close();
    }
  });

  renderPublishedPosts();
}


/* ===== Registration page functionality ===== */

// Show or hide password fields
document.querySelectorAll("[data-toggle-password]").forEach(button => {
  button.addEventListener("click", () => {
    const fieldId = button.dataset.togglePassword;
    const passwordInput = document.getElementById(fieldId);

    if (!passwordInput) return;

    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
    button.setAttribute(
      "aria-label",
      isHidden ? "Hide password" : "Show password"
    );
  });
});

// Hash a demo password before storing it.
// This is educational only, not production authentication.
async function hashDemoPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Register a demo account
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  const message = document.getElementById("registerMessage");
  const passwordInput = document.getElementById("registerPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const submitButton = registerForm.querySelector(
    'button[type="submit"]'
  );

  function showRegisterMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  // Show a helpful message while typing a confirmation password
  confirmInput.addEventListener("input", () => {
    if (!confirmInput.value) {
      showRegisterMessage("", "");
      return;
    }

    if (passwordInput.value !== confirmInput.value) {
      showRegisterMessage("Passwords do not match.", "error");
    } else {
      showRegisterMessage("Passwords match.", "success");
    }
  });

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!registerForm.reportValidity()) return;

    const fullName = document.getElementById("fullName")
      .value.trim();
    const email = document.getElementById("registerEmail")
      .value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (fullName.length < 2) {
      showRegisterMessage(
        "Please enter a name with at least 2 characters.",
        "error"
      );
      return;
    }

    if (password.length < 8) {
      showRegisterMessage(
        "Your password must contain at least 8 characters.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showRegisterMessage(
        "Passwords do not match. Please try again.",
        "error"
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      // Read previously registered demo accounts
      const users = JSON.parse(
        localStorage.getItem("blogspace_users") || "[]"
      );

      if (!Array.isArray(users)) {
        throw new Error("Invalid account data.");
      }

      const emailExists = users.some(
        user => user.email === email
      );

      if (emailExists) {
        showRegisterMessage(
          "An account with this email already exists.",
          "error"
        );
        return;
      }

      const passwordHash = await hashDemoPassword(password);

      users.push({
        id: crypto.randomUUID(),
        fullName,
        email,
        passwordHash,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem(
        "blogspace_users",
        JSON.stringify(users)
      );

      showRegisterMessage(
        "Account created successfully! You can now log in.",
        "success"
      );

      registerForm.reset();

      // Reset password visibility controls
      document.querySelectorAll("[data-toggle-password]")
        .forEach(button => {
          const field = document.getElementById(
            button.dataset.togglePassword
          );

          if (field) field.type = "password";
          button.textContent = "Show";
          button.setAttribute("aria-label", "Show password");
        });

    } catch (error) {
      console.error("Registration error:", error);

      showRegisterMessage(
        "Unable to save your account. Check browser storage and try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Account →";
    }
  });
}

/* ===== Login page functionality ===== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const loginMessage = document.getElementById("loginMessage");
  const loginButton = loginForm.querySelector(
    'button[type="submit"]'
  );

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `form-message ${type}`;
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    sessionStorage.removeItem("blogspace_session");

    if (!loginForm.reportValidity()) return;

    const email = document.getElementById("loginEmail")
      .value.trim().toLowerCase();

    const password = document.getElementById("loginPassword").value;

    loginButton.disabled = true;
    loginButton.textContent = "Verifying...";

    try {
      // Read accounts created by the Register page
      const savedUsers = localStorage.getItem("blogspace_users");
      const users = JSON.parse(savedUsers || "[]");

      if (!Array.isArray(users)) {
        throw new Error("Invalid account data.");
      }

      // Find the registered account by email
      const user = users.find(account => account.email === email);

      if (!user) {
        showLoginMessage(
          "Invalid email or password.",
          "error"
        );
        return;
      }

      // Hash the entered password using the same demo method
      const enteredPasswordHash = await hashDemoPassword(password);

      // Compare hashes instead of comparing raw passwords
      if (enteredPasswordHash !== user.passwordHash) {
        showLoginMessage(
          "Invalid email or password.",
          "error"
        );
        return;
      }

      // Save only basic identity information in the demo session
      sessionStorage.setItem(
        "blogspace_session",
        JSON.stringify({
          userId: user.id,
          fullName: user.fullName,
          email: user.email,
          loggedInAt: new Date().toISOString()
        })
      );

      showLoginMessage(
        "Login successful! Opening your dashboard...",
        "success"
      );

      // The Dashboard page will be built in the next step
      window.location.href = "dashboard.html";

    } catch (error) {
      console.error("Login error:", error);

      showLoginMessage(
        "Unable to verify your account. Check browser storage and try again.",
        "error"
      );
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Log In →";
    }
  });
}

/* ===== BlogSpace Dashboard functionality ===== */

const dashboardPage = document.querySelector(".dashboard-page");

if (dashboardPage) {
  const sessionKey = "blogspace_session";
  const postsKey = "blogspace_posts";

  let currentUser = null;

  // Safely read the demo login session
  try {
    currentUser = JSON.parse(
      sessionStorage.getItem(sessionKey) || "null"
    );
  } catch {
    currentUser = null;
  }

  // Redirect users who are not logged in
  if (!currentUser || !currentUser.userId) {
    window.location.replace("login.html");
  } else {
    initializeDashboard();
  }

  function initializeDashboard() {
    const welcomeName = document.getElementById("welcomeName");
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarAvatar = document.getElementById("sidebarAvatar");
    const postsTableBody = document.getElementById("postsTableBody");
    const dashboardMessage = document.getElementById("dashboardMessage");

    const firstName = currentUser.fullName.trim().split(/\s+/)[0];

    welcomeName.textContent = firstName;
    sidebarUserName.textContent = currentUser.fullName;
    sidebarAvatar.textContent = firstName.charAt(0).toUpperCase();

    function showDashboardMessage(text, type) {
      dashboardMessage.textContent = text;
      dashboardMessage.className = `form-message ${type}`;
    }

    // Read all saved posts
    function getAllPosts() {
      const raw = localStorage.getItem(postsKey);
      const posts = JSON.parse(raw || "[]");

      if (!Array.isArray(posts)) {
        throw new Error("Invalid blog data.");
      }

      return posts;
    }

    // Only show posts owned by the current demo user
    function getMyPosts() {
      return getAllPosts().filter(
        post => post.userId === currentUser.userId
      );
    }

    // Safely display user-provided text in HTML
    function escapeHTML(value) {
      return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[char]);
    }

    function renderDashboard() {
      try {
        const posts = getMyPosts();

        const published = posts.filter(
          post => post.status === "published"
        ).length;

        const drafts = posts.filter(
          post => post.status === "draft"
        ).length;

        document.getElementById("totalPosts").textContent =
          posts.length;

        document.getElementById("publishedPosts").textContent =
          published;

        document.getElementById("draftPosts").textContent =
          drafts;

        if (posts.length === 0) {
          postsTableBody.innerHTML = `
            <tr>
              <td colspan="4" class="empty-state">
                You haven't created any blog posts yet.
                <br><br>
                <a href="create-blog.html" class="text-link">
                  Create your first blog →
                </a>
              </td>
            </tr>
          `;
          return;
        }

        postsTableBody.innerHTML = posts.map(post => {
          const status = post.status === "published"
            ? "published"
            : "draft";

          return `
            <tr>
              <td class="post-title-cell">
                ${escapeHTML(post.title)}
              </td>
              <td>${escapeHTML(post.category || "General")}</td>
              <td>
                <span class="status-badge status-${status}">
                  ${status === "published" ? "Published" : "Draft"}
                </span>
              </td>
              <td>
                <div class="post-actions">
                  <button
                    type="button"
                    class="post-action edit-action"
                    data-edit-post="${escapeHTML(post.id)}"
                  >Edit</button>

                  <button
                    type="button"
                    class="post-action delete-action"
                    data-delete-post="${escapeHTML(post.id)}"
                  >Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join("");

      } catch (error) {
        console.error("Dashboard loading error:", error);
        postsTableBody.innerHTML = `
          <tr>
            <td colspan="4" class="empty-state">
              Unable to load your posts. Check browser storage.
            </td>
          </tr>
        `;
      }
    }

    // Handle Edit and Delete button clicks
    postsTableBody.addEventListener("click", event => {
      const editButton = event.target.closest("[data-edit-post]");
      const deleteButton = event.target.closest("[data-delete-post]");

      if (editButton) {
        const postId = editButton.dataset.editPost;

        window.location.href =
          `create-blog.html?edit=${encodeURIComponent(postId)}`;
        return;
      }

      if (deleteButton) {
        const postId = deleteButton.dataset.deletePost;

        if (!window.confirm("Are you sure you want to delete this post?")) {
          return;
        }

        try {
          const allPosts = getAllPosts();

          const target = allPosts.find(
            post => post.id === postId &&
                    post.userId === currentUser.userId
          );

          if (!target) {
            showDashboardMessage(
              "Post not found or not owned by this account.",
              "error"
            );
            return;
          }

          const remainingPosts = allPosts.filter(
            post => !(
              post.id === postId &&
              post.userId === currentUser.userId
            )
          );

          localStorage.setItem(
            postsKey,
            JSON.stringify(remainingPosts)
          );

          showDashboardMessage("Blog post deleted.", "success");
          renderDashboard();

        } catch (error) {
          console.error("Delete error:", error);
          showDashboardMessage(
            "Unable to delete the post. Check browser storage.",
            "error"
          );
        }
      }
    });

    // Demo logout
    document.getElementById("logoutButton").addEventListener(
      "click",
      () => {
        sessionStorage.removeItem(sessionKey);
        window.location.replace("login.html");
      }
    );

    renderDashboard();
  }
}

/* ===== BlogSpace Create Blog functionality ===== */

const blogForm = document.getElementById("blogForm");

if (blogForm) {
  const sessionKey = "blogspace_session";
  const postsKey = "blogspace_posts";

  const titleInput = document.getElementById("blogTitle");
  const categoryInput = document.getElementById("blogCategory");
  const coverInput = document.getElementById("blogCover");
  const contentInput = document.getElementById("blogContent");
  const characterCount = document.getElementById("characterCount");
  const blogMessage = document.getElementById("blogMessage");
  const saveDraftButton = document.getElementById("saveDraftButton");
  const publishButton = document.getElementById("publishButton");
  const editorHeading = document.getElementById("editorHeading");
  const editorStatus = document.getElementById("editorStatus");

  let currentUser = null;
  let editingPostId = null;
  let isSaving = false;

  function showBlogMessage(text, type) {
    blogMessage.textContent = text;
    blogMessage.className = `form-message ${type}`;
  }

  function readSession() {
    try {
      return JSON.parse(
        sessionStorage.getItem(sessionKey) || "null"
      );
    } catch {
      return null;
    }
  }

  function readPosts() {
    const posts = JSON.parse(
      localStorage.getItem(postsKey) || "[]"
    );

    if (!Array.isArray(posts)) {
      throw new Error("Invalid saved post data.");
    }

    return posts;
  }

  function writePosts(posts) {
    localStorage.setItem(postsKey, JSON.stringify(posts));
  }

  function setSavingState(saving, action = "") {
    isSaving = saving;
    saveDraftButton.disabled = saving;
    publishButton.disabled = saving;

    if (saving) {
      (action === "draft" ? saveDraftButton : publishButton)
        .textContent = "Saving...";
    } else {
      saveDraftButton.textContent = "Save Draft";
      publishButton.textContent = editingPostId
        ? "Update & Publish →"
        : "Publish Blog →";
    }
  }

  function updateCharacterCount() {
    characterCount.textContent = contentInput.value.length;
  }

  contentInput.addEventListener("input", updateCharacterCount);

  // Check the demo login session
  currentUser = readSession();

  if (!currentUser || !currentUser.userId) {
    window.location.replace("login.html");
  } else {
    initializeBlogEditor();
  }

  function initializeBlogEditor() {
    document.getElementById("editorUserName").textContent =
      currentUser.fullName || "Writer";

    // Read the optional post ID from the Dashboard's Edit link
    const params = new URLSearchParams(window.location.search);
    editingPostId = params.get("edit");

    if (editingPostId) {
      try {
        const posts = readPosts();

        const post = posts.find(item =>
          item.id === editingPostId &&
          item.userId === currentUser.userId
        );

        if (!post) {
          editingPostId = null;
          showBlogMessage(
            "That post could not be found in your account.",
            "error"
          );
          return;
        }

        titleInput.value = post.title || "";
        categoryInput.value = post.category || "";
        coverInput.value = post.cover || "";
        contentInput.value = post.content || "";

        editorHeading.textContent = "Edit your blog";
        editorStatus.textContent =
          post.status === "published" ? "Published post" : "Draft";

        updateCharacterCount();

        publishButton.textContent =
          post.status === "published"
            ? "Update & Publish →"
            : "Publish Blog →";

        // Add a separate update-as-draft action label when editing
        saveDraftButton.textContent = "Save as Draft";

      } catch (error) {
        console.error("Unable to load post:", error);
        showBlogMessage(
          "Unable to load this post. Check browser storage.",
          "error"
        );
      }
    }
  }

  function validateCoverUrl() {
    const value = coverInput.value.trim();

    if (!value) return true;

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function saveBlog(status) {
    if (isSaving) return;

    // Publishing requires all required fields to be valid.
    if (status === "published" && !blogForm.reportValidity()) {
      return;
    }

    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const cover = coverInput.value.trim();
    const content = contentInput.value.trim();

    if (title.length > 120 || content.length > 20000) {
      showBlogMessage(
        "Your title or article exceeds the allowed length.",
        "error"
      );
      return;
    }

    if (status === "published") {
      if (title.length < 3) {
        showBlogMessage(
          "A published post needs a title of at least 3 characters.",
          "error"
        );
        return;
      }

      if (!category) {
        showBlogMessage(
          "Choose a category before publishing.",
          "error"
        );
        return;
      }

      if (content.length < 20) {
        showBlogMessage(
          "Add at least 20 characters to your story before publishing.",
          "error"
        );
        return;
      }
    }

    if (!validateCoverUrl()) {
      showBlogMessage(
        "Enter a valid HTTP or HTTPS cover image URL.",
        "error"
      );
      return;
    }

    setSavingState(true, status === "draft" ? "draft" : "publish");

    try {
      const posts = readPosts();
      const now = new Date().toISOString();

      let existingPost = null;

      if (editingPostId) {
        existingPost = posts.find(item =>
          item.id === editingPostId &&
          item.userId === currentUser.userId
        );

        if (!existingPost) {
          showBlogMessage(
            "This post is no longer available in your account.",
            "error"
          );
          return;
        }
      }

      const post = {
        id: existingPost
          ? existingPost.id
          : crypto.randomUUID(),
        userId: currentUser.userId,
        title: title || "Untitled Draft",
        category: category || "Other",
        cover,
        content,
        status,
        createdAt: existingPost
          ? existingPost.createdAt
          : now,
        updatedAt: now
      };

      let updatedPosts;

      if (existingPost) {
        updatedPosts = posts.map(item =>
          item.id === existingPost.id &&
          item.userId === currentUser.userId
            ? post
            : item
        );
      } else {
        updatedPosts = [...posts, post];
      }

      writePosts(updatedPosts);

      showBlogMessage(
        status === "published"
          ? "Blog published successfully!"
          : "Draft saved successfully!",
        "success"
      );

      // Return to Dashboard after the save succeeds.
      // The Dashboard reads the same LocalStorage key.
      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);

    } catch (error) {
      console.error("Unable to save blog:", error);

      showBlogMessage(
        "Unable to save your blog. Check browser storage and try again.",
        "error"
      );

    } finally {
      setSavingState(false);
    }
  }

  // Save Draft intentionally bypasses publish-only required validation.
  saveDraftButton.addEventListener("click", () => {
    saveBlog("draft");
  });

  // Publish or update an existing post.
  blogForm.addEventListener("submit", event => {
    event.preventDefault();
    saveBlog("published");
  });
}
