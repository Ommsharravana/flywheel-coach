#!/bin/bash
# One-click deploy to Vercel
echo "Deploying JKKN Solution Studio to production..."
cd /Users/omm/PROJECTS/flywheel-coach
git add -A
git commit -m "Update" --allow-empty
vercel --prod
echo "Done! Check https://flywheel-coach.vercel.app"
