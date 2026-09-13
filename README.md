Financial Analytics Dashboard

A full-stack financial analytics application for tracking and analyzing company transactions, featuring interactive dashboards, advanced filtering/search, and configurable CSV export.

Table of Contents
Features
Tech Stack
Project Structure
Prerequisites
Setup Instructions
Environment Variables
Seeding Sample Data
Running the Application
Usage Examples
API Documentation
CSV Export Format
Scripts Reference
Troubleshooting
Features

Authentication & Security

JWT-based login/logout flow
Protected API routes with token validation middleware

Financial Dashboard

Revenue vs. expenses trend charts
Category breakdown visualizations
Summary metric cards (total revenue, total expenses, net, transaction count, etc.)
Paginated, responsive transaction table

Filtering, Search & Sorting

Multi-field filters: Date range, Amount range, Category, Status, User
Real-time search across transaction fields
Column-based sorting with visual (ascending/descending) indicators

CSV Export

Column selection modal to configure exported fields
Server-side CSV generation
Automatic browser download once the file is ready
Tech Stack
Layer	Technology
Frontend	React.js + TypeScript
Charts	Recharts (or Chart.js)
UI Library	Material-UI (or Ant Design / Chakra UI)
State	React Context / Redux Toolkit (or preferred alternative)
Backend	Node.js + Express + TypeScript
Database	MongoDB (Mongoose ODM)
Auth	JSON Web Tokens (JWT)
CSV	json2csv / fast-csv




Prerequisites
Node.js v18+ and npm/yarn
MongoDB v6+ (local instance or MongoDB Atlas)
Git
