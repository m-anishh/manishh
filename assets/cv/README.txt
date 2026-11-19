Drop your real CV / resume PDFs in this folder, then point to them in
content/site.js:

    profile: {
      ...
      cv: {
        main: "assets/cv/manish-bista-cv.pdf",       // the "Download CV" button
        ats:  "assets/cv/manish-bista-ats.pdf"        // the "ATS" button
      },
      ...
    }

Until you set those paths, the Download CV / ATS buttons show a short
reminder instead of downloading. No other change is needed — the buttons
become real download links automatically once the paths are set.

Same idea for everything else that holds placeholder/random data:
  - Profile photo:        profile.avatar in content/site.js
  - Projects + covers:    projects[] in content/site.js (title, desc, image)
  - Blog posts + covers:  content/posts.js (cover, body, tags, dates)
