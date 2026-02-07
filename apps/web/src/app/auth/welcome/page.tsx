import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bookapp/ui';
import { BookOpen, PartyPopper } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl">BookApp</span>
          </Link>
          <div className="flex justify-center mb-4">
            <PartyPopper className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to BookApp!</CardTitle>
          <CardDescription>
            Your account has been created successfully. Start exploring books, tracking your reading, and connecting with other readers.
          </CardDescription>
        </CardHeader>

        <CardContent />

        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/books">Browse Books</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/settings">Set up your profile</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
