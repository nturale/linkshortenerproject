---
description: Read this file to understand how to fetch data in this project. 
---
# Data Fetching guidelines
This document outlines the best practices and guidelines for fetching data in our Node.js project. Following these guidelines will help ensure that our data fetching is efficient, secure, and maintainable.

## 1. Use server components for data fetching

In Node.js project, ALWAYS use server components to fetch data. NEVER use client components for data fetching. 

## 2. Data fetching methods

ALWAYS use the helper functions in the /data directory to fetch data. NEVER fetch data directly in your components. This promotes code reusability and separation of concerns.

ALL helper functions in the /data directory should use Drizzle ORM for database interactions. NEVER use raw SQL queries or other database libraries directly in your helper functions.

