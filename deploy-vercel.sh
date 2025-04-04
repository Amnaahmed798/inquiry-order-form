#!/bin/bash

# Make sure we have the latest Vercel CLI
npm install -g vercel

# Make sure our packages are up to date
pip install -r requirements.txt

# Deploy to Vercel (assumes you're already logged in)
vercel --prod

echo "Deployment complete! Check the Vercel dashboard for details." 