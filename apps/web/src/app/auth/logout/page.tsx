'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bookapp/ui';
import { BookOpen, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">BookApp</span>
          </Link>
          <div className="flex justify-center mb-4">
            <LogOut className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Sign Out</CardTitle>
          <CardDescription>
            Are you sure you want to sign out?
          </CardDescription>
        </CardHeader>

        <CardContent />

        <CardFooter className="flex flex-col space-y-4">
          <Button
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign Out
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
