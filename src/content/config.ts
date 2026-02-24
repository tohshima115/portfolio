import { defineCollection, z } from 'astro:content';
import { ROLES } from '../consts';

const roleValues = ROLES.map((r) => r.value) as [string, ...string[]];

const projects = defineCollection({
    schema: ({ image }) => z.object({
        title: z.string(),
        meta: z.object({
            thumbnail: image().optional(), // Allow optional for initial creation or missing image
            icon: image().optional(), // Optional icon for navigation
            date: z.string().or(z.date()), // Keystatic might save as string
            updatedDate: z.coerce.date().optional(), // Added for tracking updates
            duration: z.string(),
            link: z.string().url().optional(),
        }),
        attributes: z.object({
            roles: z.array(z.enum(roleValues)),
            stack: z.array(z.string()),
        }),
    }),
});

const blog = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.string()).optional(),
    }),
});

export const collections = {
    projects,
    blog,
};
