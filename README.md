<h1 align="center">NeuroVerse</h1>

<h3 align="center">Your mind. Your moves. Your universe.</h3>

<p align="center">
  An interactive universe of AI, machine learning, and camera-powered experiences
  built for university Open Day visitors.
</p>

<p align="center">
  Career suggestions • Camera games • Fun social experiences • NeuroVerse QuestPass achievements
</p>

<hr>

<h2>About the Project</h2>

<p>
  NeuroVerse is an interactive project designed to make university Open Day more fun
  for high-school students. Visitors can explore possible careers, play camera-controlled
  games, try fun social experiences, and collect digital achievements through the
  NeuroVerse QuestPass.
</p>

<p>
  <strong>Important:</strong> This project is made for entertainment, learning, and demonstrating
  software-development concepts. It does not make real decisions about careers, relationships,
  personality, or appearance.
</p>

<hr>

<h2>Features</h2>

<h3>Career Quest</h3>

<ul>
  <li>Students enter subjects, hobbies, interests, or anything they enjoy.</li>
  <li>Uses a custom machine-learning model built with Scikit-learn.</li>
  <li>Suggests possible career paths with confidence percentages.</li>
  <li>Shows words recognised from the student's answer.</li>
  <li>Supports optional browser voice input and spoken results.</li>
  <li>Reminds users that the result is only an interest-based suggestion.</li>
</ul>

<h3>Hand Puzzle</h3>

<ul>
  <li>A camera-controlled puzzle game.</li>
  <li>Uses MediaPipe Hands to detect hand movements.</li>
  <li>Players pinch with both hands to pick up and move puzzle pieces.</li>
  <li>Includes a timer and best-score tracking.</li>
  <li>Built with HTML, CSS, and JavaScript.</li>
</ul>

<h3>Gravity Thief</h3>

<ul>
  <li>A hand-controlled gravity challenge.</li>
  <li>Players guide a stolen core through security lasers and into a portal.</li>
</ul>

<h3>Slice Club</h3>

<ul>
  <li>A 30-second finger-tracking fruit-slicing challenge.</li>
  <li>Players slice fruit, avoid bombs, and chase a high score.</li>
</ul>

<h3>SkyShot</h3>

<ul>
  <li>A 30-second finger-gun arcade experience using MediaPipe Hands.</li>
  <li>Includes Solo Blast and independent two-player Duel modes.</li>
  <li>Uses a stabilised thumb trigger, local tracking files, and separate game rendering for smooth play.</li>
  <li>Awards its QuestPass stamp only after a completed round.</li>
</ul>

<h3>VibeLink</h3>

<ul>
  <li>A playful two-person vibe compatibility experience.</li>
  <li>Participants provide consent before using camera features.</li>
  <li>Includes Friendly, Spicy, and Chaos roast levels.</li>
  <li>Displays dramatic fake scan results and compatibility measurements.</li>
  <li>Results are for entertainment and are not based on appearance or sensitive personal traits.</li>
</ul>

<h3>Vibe Oracle</h3>

<ul>
  <li>A relationship-themed fortune-telling experience.</li>
  <li>Uses nicknames and optional temporary profile photos.</li>
  <li>Generates random, dramatic, and humorous predictions.</li>
  <li>Includes Friendly and Spicy modes.</li>
</ul>

<h3>NeuroVerse QuestPass</h3>

<ul>
  <li>A digital achievement system connecting the experiences inside NeuroVerse.</li>
  <li>Tracks completed activities during the current session.</li>
  <li>Rewards players with a stamp after genuinely completing an activity.</li>
  <li>Refresh the app to begin a new QuestPass session.</li>
</ul>

<hr>

<h2>Technologies Used</h2>

<table>
  <thead>
    <tr>
      <th>Technology</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Python</td>
      <td>Main programming language</td>
    </tr>
    <tr>
      <td>Streamlit</td>
      <td>Builds and runs the main web application</td>
    </tr>
    <tr>
      <td>Pandas</td>
      <td>Reads and manages career-training data</td>
    </tr>
    <tr>
      <td>Scikit-learn</td>
      <td>Trains and runs the career-prediction model</td>
    </tr>
    <tr>
      <td>NumPy</td>
      <td>Supports data processing</td>
    </tr>
    <tr>
      <td>HTML, CSS, JavaScript</td>
      <td>Builds the interactive games and experiences</td>
    </tr>
    <tr>
      <td>MediaPipe Hands</td>
      <td>Detects hand movement for Hand Puzzle, Gravity Thief, Slice Club, SkyShot, and Vibe Oracle</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>Project Structure</h2>

<pre><code>UI/
│
├── app.py                     # Main Streamlit application
├── UI_theme.py                # Shared app styling and theme
├── career_model.py            # Career machine-learning model
├── data.csv                   # Career model training data
├── requirements.txt           # Python dependencies
│
├── Hand Puzzle.html           # Camera-controlled puzzle game
├── VibeLink_Rebuilt.html      # Two-person compatibility experience
│
├── questpass_bridge.py        # Connects HTML games to Streamlit QuestPass
├── questpass_bridge/          # Component builds for Hand Puzzle and Gravity Thief
└── static/
    ├── slice-club/            # Fruit-slicing camera game
    ├── skyshot/               # Finger-gun arcade game
    └── vibe-oracle/           # One-player fortune experience
</code></pre>

<hr>

<h2>Installation</h2>

<h3>1. Clone the Repository</h3>

<pre><code>git clone YOUR_GITHUB_REPOSITORY_LINK
</code></pre>

<p>Move into the folder containing <code>app.py</code>:</p>

<pre><code>cd UI
</code></pre>

<h3>2. Create a Virtual Environment</h3>

<p><strong>Windows PowerShell</strong></p>

<pre><code>python -m venv .venv
.\.venv\Scripts\Activate.ps1
</code></pre>

<p><strong>macOS / Linux</strong></p>

<pre><code>python3 -m venv .venv
source .venv/bin/activate
</code></pre>

<h3>3. Install Python Packages</h3>

<pre><code>pip install -r requirements.txt
</code></pre>

<hr>

<h2>Run the Project</h2>

<p>Make sure your virtual environment is active, then run:</p>

<pre><code>python -m streamlit run app.py
</code></pre>

<p>
  Streamlit should open the app automatically. If it does not, open this address in a browser:
</p>

<pre><code>http://localhost:8501
</code></pre>

<p>To stop the application, press <code>Ctrl + C</code> in the terminal.</p>

<hr>

<h2>Camera Permission</h2>

<p>
  Hand Puzzle, Gravity Thief, Slice Club, SkyShot, VibeLink, and Vibe Oracle may use the device camera.
  When asked by the browser, select <strong>Allow</strong>.
</p>

<ul>
  <li>Use a modern browser such as Google Chrome, Microsoft Edge, or Safari.</li>
  <li>Ensure another application is not already using the camera.</li>
  <li>SkyShot keeps its MediaPipe runtime locally so its tracking does not depend on a CDN.</li>
</ul>

<hr>

<h2>Machine Learning Notes</h2>

<p>
  Career Quest uses a custom machine-learning model trained using this project's
  own <code>data.csv</code> dataset.
</p>

<p>The model looks for patterns in words related to:</p>

<ul>
  <li>School subjects</li>
  <li>Hobbies</li>
  <li>Interests</li>
  <li>Activities</li>
  <li>Career-related keywords</li>
</ul>

<p>
  For example, words such as <code>biology</code>, <code>chemistry</code>, and
  <code>research</code> may increase the chance of a Scientist or Doctor suggestion.
</p>

<p>
  <strong>Note:</strong> The model is educational and based on a custom dataset.
  It is not professional career advice.
</p>

<hr>

<h2>Privacy and Safety</h2>

<ul>
  <li>Participation in camera features should always be optional.</li>
  <li>Users should provide consent before taking photos.</li>
  <li>Photos are intended for temporary session use only.</li>
  <li>VibeLink and Vibe Oracle results are fictional and entertainment-only.</li>
  <li>The project does not use facial recognition or judge attractiveness.</li>
  <li>Results should not be used for real relationship, career, or identity decisions.</li>
</ul>

<hr>

<h2>Future Improvements</h2>

<ul>
  <li>Add a two-player Hand Puzzle race mode.</li>
  <li>Add voice input to Career Quest.</li>
  <li>Expand the career-training dataset with more realistic examples.</li>
  <li>Add more NeuroVerse mini-games.</li>
  <li>Add sound effects, animations, and a leaderboard.</li>
  <li>Add QR-code sharing for QuestPass results.</li>
  <li>Save QuestPass progress using QR codes or accounts.</li>
  <li>Deploy the project online.</li>
</ul>

<hr>

<h2>Author</h2>

<p>
  Created by <strong>Root | Knox | Juls | Leila </strong> for NeuroVerse, an interactive
  Open Day software-development project.
</p>
