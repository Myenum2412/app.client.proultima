"use client";

// ** Imports: React & Hooks **
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// ** UI Components **
import {
  SidebarInset,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/blocks/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// ** Dropdown Menu Components **
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ** Icons **
import {
  Brush,
  Camera,
  ChartBarIncreasing,
  ChevronUp,
  CircleFadingPlus,
  CircleOff,
  CircleUserRound,
  File,
  Image,
  ListFilter,
  Menu,
  MessageCircle,
  MessageSquareDashed,
  MessageSquareDot,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Smile,
  SquarePen,
  Star,
  User,
  User2,
  UserRound,
  Users,
  Video,
} from "lucide-react";

// ** Contact List **
const contactList = [
  {
    name: "Vel",
    message: "Your Last Message Here",
    // image: "https://github.com/rayimanoj8.png",
  },
  {
    name: "Sathish",
    message: "Your Last Message Here",
    // image: "https://github.com/rayimanoj8.png",
  },
 
];

// ** Sidebar Menu Items **
const menuItems = [
  { title: "Messages", url: "#", icon: MessageCircle },
  { title: "Phone", url: "#", icon: Phone },
  { title: "Status", url: "#", icon: CircleFadingPlus },
];

// ** Home Component **
export const ChatTemplate = () => {
  const { toggleSidebar } = useSidebar();
  const [currentChat, setCurrentChat] = useState(contactList[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden p-4 bg-primary/10"
    >
      <ResizablePanelGroup orientation="horizontal" className="h-full gap-x-0.5 w-full">
        {/* Left Panel - Chat List */}
        <ResizablePanel
          defaultSize={100}
          minSize={30}
          maxSize={250}
          className="flex flex-col border-r"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col h-full w-full overflow-hidden bg-background rounded-lg shadow-sm"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="h-14 px-4 py-3 flex items-center border-b shrink-0"
            >
              <p className="font-semibold text-base">Chats</p>
              <div className="flex justify-end w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon">
                      <SquarePen />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <User /> New Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users /> New Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <ListFilter />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Filter Chats By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <MessageSquareDot /> Unread
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star /> Favorites
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CircleUserRound /> Contacts
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CircleOff /> Non Contacts
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Users /> Groups
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquareDashed /> Drafts
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
               </div>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="relative px-4 py-3 border-b shrink-0"
            >
              <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search or start new chat" className="pl-10" />
            </motion.div>

            {/* Contact List */}
            <ScrollArea className="flex-1">
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.03,
                      delayChildren: 0.1,
                    },
                  },
                }}
                className="flex flex-col"
              >
                <AnimatePresence>
                  {contactList.map((contact, index) => (
                    <motion.button
                      key={contact.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor:
                          currentChat?.name === contact.name
                            ? "rgba(0,0,0,0.08)"
                            : "transparent",
                      }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.3,
                        ease: [0.4, 0, 0.2, 1],
                        backgroundColor: { duration: 0.2 },
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentChat(contact)}
                      className="px-4 w-full py-3 hover:bg-accent/50 cursor-pointer text-left rounded-md"
                    >
                    <div className="flex flex-row gap-3 items-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {/* <AvatarImage src={contact.image} /> */}
                          <AvatarFallback>{contact.name[0]}</AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {contact.name}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {contact.message}
                        </CardDescription>
                      </div>
                    </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
          </motion.div>
        </ResizablePanel>

        <ResizableHandle className="hidden md:flex" />

        {/* Right Panel - Chat Window */}
        <ResizablePanel
          defaultSize={70}
          minSize={100}
          className="flex flex-col w-full"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChat?.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col h-full w-full overflow-hidden bg-white rounded-lg shadow-md"
            >
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              className="h-16 border-b flex items-center px-4 shrink-0"
            >
              <motion.div
                key={currentChat?.name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  {/* <AvatarImage src={currentChat?.image} /> */}
                  <AvatarFallback>{currentChat?.name[0]}</AvatarFallback>
                </Avatar>
              </motion.div>
              <motion.div
                key={`info-${currentChat?.name}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex-1 min-w-0 ml-3"
              >
                <CardTitle className="text-sm font-medium truncate">
                  {currentChat?.name}
                </CardTitle>
                <CardDescription className="text-xs">Online</CardDescription>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex gap-1 shrink-0"
              >
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Video className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Phone className="h-4 w-4" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="hidden md:block"
                >
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Search className="h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Chat Messages Area - Empty State for now */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex-1 overflow-hidden flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="text-center text-muted-foreground"
              >
                <p className="text-sm">
                  Select a conversation to start chatting
                </p>
              </motion.div>
            </motion.div>

            {/* Chat Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="flex items-center gap-2 p-4 border-t shrink-0 bg-background"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </motion.div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Image className="h-4 w-4 mr-2" /> Photos & Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Camera className="h-4 w-4 mr-2" /> Camera
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <File className="h-4 w-4 mr-2" /> Document
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserRound className="h-4 w-4 mr-2" /> Contact
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ChartBarIncreasing className="h-4 w-4 mr-2" /> Poll
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Brush className="h-4 w-4 mr-2" /> Drawing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <motion.div
                className="flex-1"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Input className="flex-1" placeholder="Type a message..." />
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="hidden sm:block"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        </ResizablePanel>
      </ResizablePanelGroup>
    </motion.div>
  );
};
